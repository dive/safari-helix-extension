# Shelix

Shelix is a Safari extension that brings Helix keybindings to the browser for keyboard-first navigation, smooth scrolling, tab control, and history actions.

## Features
- Helix-style keyboard-first navigation
- Smooth continuous page scrolling with home-row keys
- Input-field focus navigation without leaving the keyboard
- Foundation for tab and history shortcuts

## Requirements
- Safari on macOS (Safari 14 or later recommended)
- Optional: Safari on iOS/iPadOS (15 or later) if you build and distribute the iOS variant

## Installation
1. Open `Shelix/Shelix.xcodeproj` in Xcode.
2. Build and run the `Shelix` macOS app.
3. Enable `Shelix` in Safari at `Safari Settings > Extensions`.

## Usage
- Use Helix-style keybindings directly on webpages.
- Configure extension permissions and site access from Safari extension settings.

## Keybindings
- `j` / `k`: smooth continuous scrolling down/up while held
- `h` / `l`: move highlighted input selection to previous/next input field
- `Enter` or `o`: enter Insert mode and focus the highlighted input field
- `Escape`: leave Insert mode and return to Normal mode

Notes:
- In Normal mode, `h`/`l` only changes highlight and does not activate editing.
- In Insert mode, typing works normally in the focused field.
- Input-field selection includes text inputs, textareas, and contenteditable elements.

## Permissions
Shelix is designed to request only what it needs for keyboard-first browsing.

## Troubleshooting
- If you do not see the extension, restart Safari and check `Safari Settings > Extensions`.
- Ensure the extension is enabled and has access for the current site.

## Testing
- `https://en.wikipedia.org/wiki/Safari_(web_browser)` for long-page smooth scrolling checks (`j/k`).
- `https://httpbin.org/forms/post` for multi-field form navigation (`h/l`, `Enter`/`o`, `Escape`).
- `https://www.w3schools.com/html/html_forms.asp` for mixed form controls and repeated mode switching.
- `https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input` for docs-page scrolling plus editable-field transitions.

## Project Structure
- `Shelix/Shelix`: macOS host app used to install and manage the Safari extension.
- `Shelix/Shelix Extension`: Safari Web Extension bundle (manifest, scripts, popup, locales).

## Development
- Build and run the host app from Xcode.
- For extension behavior changes, edit files in `Shelix/Shelix Extension/Resources`.

## Privacy
Shelix processes key events locally on-device. No browsing data is sent off-device.
