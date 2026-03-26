// Copyright 2022 Eray Erdin.
// Use of this source code is governed by the WTFPL
// license that can be found in the LICENSE file.

use std::{env, process};

fn main() {
    println!("cargo:rerun-if-changed=frontend/build");
    println!("cargo:rerun-if-changed=.build.env");
    println!("cargo:rerun-if-changed=build.env");

    {
        let dotenv_file = [".build.env", "build.env"]
            .iter()
            .find(|file| std::path::Path::new(*file).exists())
            .copied()
            .expect("Could not find `.build.env` or `build.env` file.");

        let dotenv_path =
            dotenvy::from_filename(dotenv_file).expect("Could not read build env file.");
        println!("cargo:rerun-if-changed={}", dotenv_path.display());

        for key in ["NODE_PROJECT_DIR"] {
            if let Ok(val) = env::var(key) {
                println!("cargo:rustc-env={key}={val}");
            }
        }
    }

    {
        match process::Command::new("npm").arg("--version").output() {
            Ok(_) => {}
            Err(err) if err.kind() == std::io::ErrorKind::NotFound => {
                println!(
                    "cargo:warning=Skipping frontend build because `npm` is not available in PATH."
                );
                return;
            }
            Err(err) => panic!("Could not check npm availability. {err}"),
        }

        let project_root_dir = env::current_dir().expect("Could not get project root directory.");
        env::set_current_dir(project_root_dir.join(
            env::var("NODE_PROJECT_DIR").expect("Could not read `NODE_PROJECT_DIR` build env var."),
        ))
        .expect("Could not change cwd to `NODE_PROJECT_DIR`.");

        let child_process = process::Command::new("npm")
            .args(["run", "build"])
            .spawn()
            .expect("Could not build node project.");

        let output = child_process
            .wait_with_output()
            .expect("Could not wait for `npm run build` output.");
        println!(
            "{}",
            String::from_utf8(output.stdout)
                .expect("stdout of `npm run build` has invalid UTF-8 bytes.")
        );
        println!(
            "{}",
            String::from_utf8(output.stderr)
                .expect("stderr of `npm run build` has invalid UTF-8 bytes.")
        );

        env::set_current_dir(project_root_dir)
            .expect("Could not change cwd back to project root directory.");
    }
}
