# Graphical Passwords Accessibility Extension

A browser extension to improve accessibility for graphical password systems.

## Features

- Enhanced accessibility for graphical password interfaces
- Keyboard navigation support
- Screen reader compatibility
- Customizable UI options

## Installation

1. Clone this repository:
   ```sh
   git clone https://github.com/yourusername/auth-accessibility-extension.git
   ```
2. Open your browser's extension manager.
3. Load the `Graphical PWs` folder as an unpacked extension.

## Usage

- Activate the extension from your browser toolbar.
- Follow on-screen instructions to use accessible graphical passwords.

## Development


## Sign Up Workflow
- Users activate hotkey to turn on extension to select the password field.
- Once the PW field is selected, user uploads an image they'd like to be that site's password.
- Picture will be obfuscated with a filter. User may choose not to use one.
- Picture is broken up into 3 squares on a 3x3 grid.
- The PW will be a hash of the RGB values in each square. Order will not matter.
- Pull random pictures from Flickr to fill remaining squares.
- Have user confirm that they want to use the image.
- Fill PW field with the hash.
- Store sitename and hash in local storage.