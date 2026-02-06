# Shelix

Shelix is a Safari extension that brings Helix keybindings to the browser for keyboard-first navigation, smooth scrolling, tab control, and history actions.

## Features
- Helix-style keyboard-first navigation
- Smooth continuous page scrolling with home-row keys
- Input-field focus navigation without leaving the keyboard
- Helix-style tab actions with `g`-prefixed key sequences

## Content Script Layout
- `shared/constants.js`: shared action IDs, keymaps, and tab-action protocol
- `content/config.js`: content-script constants and selectors
- `content/state.js`: centralized mutable runtime state
- `content/key-utils.js`: key normalization and key label formatting
- `content/dom-utils.js`: editable/visibility helpers and DOM predicates
- `content/ui.js`: input highlight and key-hint popup UI
- `content/scroll-controller.js`: continuous scroll loop and key state
- `content/input-controller.js`: input highlight/focus mode transitions
- `content/find-controller.js`: find UI, match collection, and navigation
- `content/action-dispatch.js`: action handler map and prefix handling
- `content/events.js`: keyboard/focus/visibility event wiring
- `content.js`: one-time bootstrap guard and initialization

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
- `Ctrl-f` / `Ctrl-b`: scroll full page down/up
- `Ctrl-o` / `Ctrl-i`: browser history back/forward
- `f`: show link hints on visible links/buttons, type the label to click
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
- On engines without CSS Highlights support, Find still navigates matches but visual match highlighting may be limited.
- In the Find bar, `Enter`/`Shift+Enter` move next/previous and `Escape` closes it.
- Tab actions run only in Normal mode.
- Prefix keys (`Space`, `g`) show a bottom-right key-hint popup with available follow-up actions.
- Input-field selection includes text inputs, textareas, and contenteditable elements.
- `f` in Helix is "find next char"; here it is repurposed for browser-specific link hint navigation (similar to Vimium's `f`).

## Permissions
Shelix is designed to request only what it needs for keyboard-first browsing.
- `tabs`: required for next/previous tab navigation, new tab, close tab, and duplicate tab actions.

## Troubleshooting
- If you do not see the extension, restart Safari and check `Safari Settings > Extensions`.
- Ensure the extension is enabled and has access for the current site.

## Behavior Verification Checklist
- Verify `j`/`k` starts and stops smooth scrolling on keydown/keyup.
- Verify `Ctrl-d`/`Ctrl-u`, `Ctrl-f`/`Ctrl-b`, `g g`, and `g e` navigation in Normal mode.
- Verify `Ctrl-o`/`Ctrl-i` navigate browser history back/forward.
- Verify `f` shows link hint labels on visible links/buttons, typing label clicks the element, `Escape` dismisses.
- Verify `h`/`l` highlight changes and `Enter`/`i` enters Insert mode.
- Verify `Escape` exits Insert mode, clears highlight in Normal mode, and closes Find UI.
- Verify `/` opens Find UI and `n`/`N` navigates visible matches.
- Verify `Space n`, `Space q`, `Space d`, `g n`, and `g p` trigger tab actions.

## Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, testing guidance, and pull request expectations.

## Privacy
Shelix processes key events locally on-device. No browsing data is sent off-device.
