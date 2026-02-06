# Contributing to Shelix

Thanks for helping improve Shelix.

## Getting Started

### Prerequisites
- Safari on macOS (Safari 14+ recommended)
- Xcode with Safari Web Extension support
- Optional: Safari on iOS/iPadOS (15+) if you build the iOS variant

### Local Setup
1. Open `Shelix/Shelix.xcodeproj` in Xcode.
2. Build and run the `Shelix` macOS app target.
3. Enable the extension in `Safari Settings > Extensions`.

## Project Structure
- `Shelix/Shelix`: macOS host app used to install and manage the Safari extension.
- `Shelix/Shelix Extension`: Safari Web Extension bundle (manifest, scripts, popup, locales).

## Development Guidelines

- Keep changes focused and scoped to the feature/fix.
- For extension behavior changes, edit files in `Shelix/Shelix Extension/Resources`.
- Keep Helix-style mappings aligned with the official Helix keymap: https://docs.helix-editor.com/master/keymap.html
- If a browser mapping intentionally diverges from Helix, document the rationale in `README.md`.
- For injected UI (hints/popups), use Safari/system typography preferences.

## Find Command Behavior

When changing find-related code, preserve these rules:
- `/` opens the Find prompt and starts search from the page boundary.
- The first **visible** match should be highlighted.
- `n` / `N` move to next/previous **visible** matches.
- Hidden or non-rendered matches (for example `display: none`, `visibility: hidden`, collapsed/zero-rect content) must be skipped.

## Testing

Run a manual test pass before opening a PR.

### Recommended pages
- `https://en.wikipedia.org/wiki/Safari_(web_browser)` for long-page smooth scrolling checks (`j/k`).
- `https://httpbin.org/forms/post` for multi-field form navigation (`h/l`, `Enter`/`i`, `Escape`).
- `https://www.w3schools.com/html/html_forms.asp` for mixed form controls and repeated mode switching.
- `https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input` for docs-page scrolling plus editable-field transitions.

### Find-specific checks
- `/` should highlight the first visible match for a query.
- `n` should continue forward through visible matches.
- `N` should continue backward through visible matches.
- Matches inside hidden/non-rendered content should not become the active highlight.

## Pull Request Checklist

- [ ] Scope is focused and does not include unrelated refactors.
- [ ] Manual testing completed (including Find behavior when relevant).
- [ ] `README.md` updated if behavior/keybindings changed.
- [ ] Screenshots or short notes added for UI/interaction changes.
- [ ] Commit messages are clear and descriptive.
