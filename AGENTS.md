# AGENTS.md

## Keymap Source Of Truth
- For any Helix-style keybinding, verify the mapping against the official Helix keymap before implementing.
- Reference: https://docs.helix-editor.com/master/keymap.html
- If a browser mapping intentionally diverges from Helix, document the rationale in `README.md`.

## UI Typography
- For injected extension UI (hints/popups), use Safari/system UI typography preferences.
- Do not inherit page typography and do not hardcode pixel font sizes.
