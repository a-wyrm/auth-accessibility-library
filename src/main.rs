// `::` is "import from".
use std::path;

// Rate limiter middleware for API abuse resistance.
use actix_governor::{Governor, GovernorConfigBuilder};
// Identity + session middleware used for auth-capable web flows.
use actix_identity::IdentityMiddleware;
use actix_session::{storage::CookieSessionStore, SessionMiddleware};
// Core Actix types for app wiring, request extractors, and HTTP responses.
use actix_web::{cookie::Key, web, App, HttpResponse, HttpServer, Responder};
// MongoDB client, db handle, and BSON helper macro.
use mongodb::{bson::doc, options::ClientOptions, Client, Database};
// ASL domain modules (policy, verifier, repository) and app boot config.
use reactix::{
    auth::asl::{
        AslLexiconItem, AslPolicy, AslRepository, AslVerifier, AslVerifierConfig,
        EnrollmentSelection, LoginSelection,
    },
    config::{init_command, init_config},
    logging::init_logger,
};
// Request/response payload (de)serialization.
use serde::{Deserialize, Serialize};

/// Basic health endpoint for quick service checks.
#[actix_web::get("/")]
async fn hello() -> impl Responder {
    "Online!"
}

// Request body used by both enroll/start and login/start.
// implements trait implements for this struct
#[derive(Debug, Deserialize)]
struct AslStartRequest {
    locale: Option<String>,
}

// Request body used by enroll/finish and login/verify.
#[derive(Debug, Deserialize)]
struct AslFinishRequest {
    user_id: String,
    item_ids: Vec<u16>,
}

// One ASL item sent to frontend; translation may be hidden for login.
#[derive(Debug, Serialize)]
struct AslLexiconResponseItem {
    id: u16,
    gesture_label: String,
    translation_label: Option<String>,
}

// Response shape for start endpoints, including visibility policy.
#[derive(Debug, Serialize)]
struct AslStartResponse {
    translation_visible: bool,
    items: Vec<AslLexiconResponseItem>,
}

// Generic operation response for failure/success messages.
#[derive(Debug, Serialize)]
struct AslOperationResponse {
    success: bool,
    message: String,
}

// Login verification response (true only when sequence matches).
#[derive(Debug, Serialize)]
struct AslVerifyResponse {
    authenticated: bool,
}

/// Returns ASL lexicon for enrollment with translation labels visible.
#[actix_web::post("/api/auth/asl/enroll/start")]
async fn asl_enroll_start(
    db: web::Data<Database>,
    payload: web::Json<AslStartRequest>,
) -> HttpResponse {
    let repository = AslRepository::new(db.get_ref());
    let locale = payload
        .locale
        .clone()
        .unwrap_or_else(|| "en-US".to_string());

    if let Err(err) = seed_default_lexicon(&repository, &locale).await {
        return HttpResponse::InternalServerError().json(AslOperationResponse {
            success: false,
            message: format!("failed to seed lexicon: {err}"),
        });
    }

    let items = match repository.list_active_lexicon(&locale).await {
        Ok(items) => items,
        Err(err) => {
            return HttpResponse::InternalServerError().json(AslOperationResponse {
                success: false,
                message: format!("failed to load lexicon: {err}"),
            })
        }
    };

    let response = AslStartResponse {
        translation_visible: true,
        items: items
            .into_iter()
            .map(|item| AslLexiconResponseItem {
                id: item.id,
                gesture_label: item.gesture_label,
                translation_label: Some(item.translation_label),
            })
            .collect(),
    };

    HttpResponse::Ok().json(response)
}

/// Validates enrollment selection, derives Argon2id verifier, and stores credential.
#[actix_web::post("/api/auth/asl/enroll/finish")]
async fn asl_enroll_finish(
    config: web::Data<reactix::config::Config>,
    db: web::Data<Database>,
    payload: web::Json<AslFinishRequest>,
) -> HttpResponse {
    let policy = AslPolicy {
        required_selection_size: usize::from(config.asl_required_selection_size),
    };
    let selection = EnrollmentSelection {
        item_ids: payload.item_ids.clone(),
    };

    if let Err(err) = policy.validate_enrollment(&selection) {
        return HttpResponse::BadRequest().json(AslOperationResponse {
            success: false,
            message: format!("invalid enrollment selection: {err}"),
        });
    }

    let verifier = AslVerifier::new(AslVerifierConfig::from_app_config(config.get_ref()));
    let record = match verifier.derive_verifier(&selection) {
        Ok(record) => record,
        Err(err) => {
            return HttpResponse::InternalServerError().json(AslOperationResponse {
                success: false,
                message: format!("could not derive verifier: {err}"),
            })
        }
    };

    let repository = AslRepository::new(db.get_ref());
    match repository
        .upsert_credential(payload.user_id.as_str(), &record)
        .await
    {
        Ok(()) => HttpResponse::Ok().json(AslOperationResponse {
            success: true,
            message: "enrollment stored".to_string(),
        }),
        Err(err) => HttpResponse::InternalServerError().json(AslOperationResponse {
            success: false,
            message: format!("failed to store enrollment: {err}"),
        }),
    }
}

/// Returns ASL lexicon for login with translations intentionally hidden.
#[actix_web::post("/api/auth/asl/login/start")]
async fn asl_login_start(
    db: web::Data<Database>,
    payload: web::Json<AslStartRequest>,
) -> HttpResponse {
    let repository = AslRepository::new(db.get_ref());
    let locale = payload
        .locale
        .clone()
        .unwrap_or_else(|| "en-US".to_string());

    if let Err(err) = seed_default_lexicon(&repository, &locale).await {
        return HttpResponse::InternalServerError().json(AslOperationResponse {
            success: false,
            message: format!("failed to seed lexicon: {err}"),
        });
    }

    let items = match repository.list_active_lexicon(&locale).await {
        Ok(items) => items,
        Err(err) => {
            return HttpResponse::InternalServerError().json(AslOperationResponse {
                success: false,
                message: format!("failed to load lexicon: {err}"),
            })
        }
    };

    let response = AslStartResponse {
        translation_visible: false,
        items: items
            .into_iter()
            .map(|item| AslLexiconResponseItem {
                id: item.id,
                gesture_label: item.gesture_label,
                translation_label: None,
            })
            .collect(),
    };

    HttpResponse::Ok().json(response)
}

/// Validates login selection and verifies it against stored Argon2id credential.
#[actix_web::post("/api/auth/asl/login/verify")]
async fn asl_login_verify(
    config: web::Data<reactix::config::Config>,
    db: web::Data<Database>,
    payload: web::Json<AslFinishRequest>,
) -> HttpResponse {
    let policy = AslPolicy {
        required_selection_size: usize::from(config.asl_required_selection_size),
    };
    let selection = LoginSelection {
        item_ids: payload.item_ids.clone(),
    };

    if let Err(err) = policy.validate_login(&selection) {
        return HttpResponse::BadRequest().json(AslOperationResponse {
            success: false,
            message: format!("invalid login selection: {err}"),
        });
    }

    let repository = AslRepository::new(db.get_ref());
    let stored = match repository.get_credential(payload.user_id.as_str()).await {
        Ok(maybe_record) => maybe_record,
        Err(err) => {
            return HttpResponse::InternalServerError().json(AslOperationResponse {
                success: false,
                message: format!("failed to load credential: {err}"),
            })
        }
    };

    let Some(record) = stored else {
        return HttpResponse::Ok().json(AslVerifyResponse {
            authenticated: false,
        });
    };

    let verifier = AslVerifier::new(AslVerifierConfig::from_app_config(config.get_ref()));
    match verifier.verify(&selection, &record) {
        Ok(is_valid) => HttpResponse::Ok().json(AslVerifyResponse {
            authenticated: is_valid,
        }),
        Err(err) => HttpResponse::InternalServerError().json(AslOperationResponse {
            success: false,
            message: format!("verification failed: {err}"),
        }),
    }
}

/// Seeds a minimal default lexicon when the collection is empty.
async fn seed_default_lexicon(repository: &AslRepository, locale: &str) -> anyhow::Result<()> {
    let defaults = vec![
        AslLexiconItem {
            id: 1,
            locale: locale.to_string(),
            gesture_label: "FLAT HAND TO PALM".to_string(),
            translation_label: "Stop".to_string(),
            active: true,
            sort_order: 1,
        },
        AslLexiconItem {
            id: 2,
            locale: locale.to_string(),
            gesture_label: "FIST TO CHEST, CIRCULAR MOTION".to_string(),
            translation_label: "Sorry".to_string(),
            active: true,
            sort_order: 2,
        },
        AslLexiconItem {
            id: 3,
            locale: locale.to_string(),
            gesture_label: "FLAT HAND TO CHIN, OUTWARD".to_string(),
            translation_label: "Thank You".to_string(),
            active: true,
            sort_order: 3,
        },
        AslLexiconItem {
            id: 4,
            locale: locale.to_string(),
            gesture_label: "CLICKING FINGERS IN FACE".to_string(),
            translation_label: "Bug".to_string(),
            active: true,
            sort_order: 4,
        },
        AslLexiconItem {
            id: 5,
            locale: locale.to_string(),
            gesture_label: "INDEX AND FINGER TO CHIN, PULLED DOWN".to_string(),
            translation_label: "Cute".to_string(),
            active: true,
            sort_order: 5,
        },
    ];

    repository.seed_lexicon_if_empty(&defaults).await?;
    Ok(())
}

/// Application bootstrap:
/// 1) load config and validate secrets
/// 2) initialize logging, rate-limit settings, and Mongo connection
/// 3) build Actix app with middleware + routes + static frontend
#[actix_web::main]
async fn main() -> anyhow::Result<()> {
    log::debug!("Initializing server...");

    let cli_matches = init_command().get_matches();
    let dotenv_path = cli_matches
        .get_one::<path::PathBuf>("env-file")
        .expect("Could not get `env-file` flag value.");

    let config = init_config(dotenv_path)?;
    let server_config = config.clone(); // to move in HttpServer closure

    // Session key must be at least 32 bytes for cookie crypto.
    let session_secret = config.session_secret_key.as_bytes();
    anyhow::ensure!(
        session_secret.len() >= 32,
        "WEBAPP_SESSION_SECRET_KEY must be at least 32 characters long. Current length: {}",
        session_secret.len()
    );
    let session_key = Key::derive_from(session_secret);

    init_logger(config.log_target.clone(), config.log_level, config.log_file)?;

    // Governor applies global HTTP method throttling configured via env.
    let governor_conf = GovernorConfigBuilder::default()
        .per_second(config.throttle_per_second)
        .burst_size(config.throttle_burst_size)
        .methods(config.throttle_methods)
        .finish()
        .expect("Could not build governor throttle configuration.");

    // Connect to Mongo and ping once so startup fails fast on bad config.
    let mongo_options = ClientOptions::parse(&config.mongo_url).await?;
    let mongo_client = Client::with_options(mongo_options)?;
    let mongo_db = mongo_client.database(&config.mongo_database);
    mongo_db.run_command(doc! { "ping": 1 }, None).await?;

    log::info!("Running server on: http://{}:{}", config.host, config.port);
    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(server_config.clone()))
            .app_data(web::Data::new(mongo_db.clone()))
            .wrap(Governor::new(&governor_conf))
            .wrap(IdentityMiddleware::default())
            // Cookie-backed session store for auth-related state.
            .wrap(SessionMiddleware::new(
                CookieSessionStore::default(),
                session_key.clone(),
            ))
            // API routes are registered before static files.
            .service(hello)
            .service(asl_enroll_start)
            .service(asl_enroll_finish)
            .service(asl_login_start)
            .service(asl_login_verify)
            .service(actix_files::Files::new("/", "frontend/build").index_file("index.html"))
    })
    .bind((config.host, config.port))?
    .run()
    .await
    .map_err(|err| anyhow::anyhow!("An error occured while running the server. {:?}", err))
}
