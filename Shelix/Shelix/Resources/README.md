# Shelix — Helix keybindings for Safari

Shelix is a Safari extension that brings Helix keybindings to the browser: fast, keyboard‑first navigation, page scrolling, tab and history control, and command‑driven actions — all without leaving the home row.

## Features
- Helix‑style motion for links, scrolling, and focus
- Quick tab switching and history navigation from the keyboard
- Command‑driven actions for common tasks
- Minimal UI designed to stay out of your way

## Requirements
- Safari on macOS (Safari 14 or later recommended)
- Optional: Safari on iOS/iPadOS (15 or later) if you build and distribute the iOS variant

## Installation
1. Build and run the macOS host app from Xcode.
2. When prompted, open Safari and enable the extension:
   - macOS Ventura and later: Safari Settings > Extensions
   - macOS Monterey and earlier: Safari Preferences > Extensions
3. Check the box next to “Shelix” to turn it on.

## Usage
- Use Helix keybindings to move, select, and act on elements.
- Toggle or configure the extension from Safari Settings/Preferences > Extensions.
- Site access can be adjusted from the extension details screen in Safari.

## Keybindings (current base)
- `j`: scroll down
- `k`: scroll up
- `h`: jump focus to the previous input field
- `l`: jump focus to the next input field

Notes:
- Keybindings run only when you are not currently typing in an editable field.
- Input field jumps include text inputs, textareas, and contenteditable elements.

## Permissions
Shelix requests only the permissions it needs to provide keyboard‑first browsing:
- activeTab — act on the current page when you interact with the extension
- tabs — switch, close, or move tabs from the keyboard
- storage — store your preferences locally

## Troubleshooting
- If you don’t see the extension, quit and relaunch Safari, then revisit Settings/Preferences > Extensions.
- Ensure the extension is allowed on the sites you want to use.
- If keybindings aren’t active, confirm Shelix is enabled and has site access.

## Development
- Open the project in Xcode and build the macOS host app.
- The host app presents a page with a shortcut to open Safari Settings/Preferences > Extensions.
- For web extension changes, modify the WebExtension resources (scripts, HTML, manifest) and rebuild.

## Privacy
Shelix processes your keystrokes locally to translate them into browser actions. No browsing data is sent off your device. Preferences are stored locally using browser or system storage.

## License
MIT
