# Shelix

Shelix is a Safari extension that brings Helix keybindings to the browser for keyboard-first navigation, smooth scrolling, tab control, and history actions.

## Features
- Helix-style keyboard-first navigation
- Smooth continuous page scrolling with home-row keys
- Input-field focus navigation without leaving the keyboard
- Helix-style tab actions with `g`-prefixed key sequences

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
- `/`: open the Find bar
- `n` / `N`: jump to next/previous Find match
- `h` / `l`: move highlighted input selection to previous/next input field
- `Enter` or `i`: enter Insert mode and focus the highlighted input field
- `Escape`: leave Insert mode and return to Normal mode
- `g n`: switch to next tab
- `g p`: switch to previous tab
- `Space n`: open a new tab
- `Space q`: close the current tab
- `Space d`: duplicate the current tab

Notes:
- In Normal mode, `h`/`l` only changes highlight and does not activate editing.
- In Insert mode, typing works normally in the focused field.
- Pressing `i` with no current selection enters Insert mode in the first available input field.
- Pressing `Escape` in Normal mode clears the current input highlight.
- `/` starts Find from the page boundary and highlights the first visible match.
- `n`/`N` continue through visible matches only (hidden/non-rendered matches are skipped).
- In the Find bar, `Enter`/`Shift+Enter` move next/previous and `Escape` closes it.
- Tab actions run only in Normal mode.
- Prefix keys (`Space`, `g`) show a bottom-right key-hint popup with available follow-up actions.
- Input-field selection includes text inputs, textareas, and contenteditable elements.

## Permissions
Shelix is designed to request only what it needs for keyboard-first browsing.
- `tabs`: required for next/previous tab navigation, new tab, close tab, and duplicate tab actions.

## Troubleshooting
- If you do not see the extension, restart Safari and check `Safari Settings > Extensions`.
- Ensure the extension is enabled and has access for the current site.

## Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, testing guidance, and pull request expectations.

## Privacy
Shelix processes key events locally on-device. No browsing data is sent off-device.
