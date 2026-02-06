# AGENTS.md

## Keymap Source Of Truth
- For any Helix-style keybinding, verify the mapping against the official Helix keymap before implementing.
- Reference: https://docs.helix-editor.com/master/keymap.html
- If a browser mapping intentionally diverges from Helix, document the rationale in `README.md`.

## Actions & Key Hint Popup
- All new actions must be added to `HELP_KEY_HINT_ROWS` in `shared/constants.js`.
- Pressing `Space` shows the full keymap (all bindings), not just Space-prefix actions. Keep `HELP_KEY_HINT_ROWS` complete.

## UI Typography
- For injected extension UI (hints/popups), use Safari/system UI typography preferences.
- Do not inherit page typography and do not hardcode pixel font sizes.

## Build Packaging Note
- Xcode resource copy for `Shelix Extension` flattens most JS from `Resources/content/` and `Resources/shared/` into `Contents/Resources/` in the built `.appex`.
- Treat `manifest.json` root-level JS paths as intentional for runtime (`constants.js`, `config.js`, etc.). Do not "fix" them to `content/...` or `shared/...` without validating the built artifact.
- When unsure, validate with `xcodebuild` and inspect `Shelix/build/Debug/Shelix Extension.appex/Contents/Resources/`.
