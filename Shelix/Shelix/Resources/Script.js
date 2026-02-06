function show(enabled, useSettingsInsteadOfPreferences) {
    const settingsLabel = useSettingsInsteadOfPreferences ? "Settings" : "Preferences";
    const location = `Safari ${settingsLabel} > Extensions`;
    const shortcutLocation = `Safari ${settingsLabel} > Extensions > Keyboard Shortcuts`;

    document.getElementsByClassName('state-on')[0].innerText =
        `Shelix is on — Helix keybindings are active for fast, keyboard‑first browsing. Manage it in ${location}. Toggle shortcut default: Command + Control + H (editable in ${shortcutLocation}).`;
    document.getElementsByClassName('state-off')[0].innerText =
        `Shelix is off. Enable it in ${location} to get Helix keybindings for navigation, scrolling, tabs, and history — without leaving the home row. Toggle shortcut default: Command + Control + H (editable in ${shortcutLocation}).`;
    document.getElementsByClassName('state-unknown')[0].innerText =
        `Enable Shelix in ${location} to bring Helix keybindings to the browser. Toggle shortcut default: Command + Control + H (editable in ${shortcutLocation}).`;
    document.getElementsByClassName('open-preferences')[0].innerText =
        (useSettingsInsteadOfPreferences
            ? "Quit and Open Safari Settings (Extensions & Shortcuts)…"
            : "Quit and Open Safari Preferences (Extensions & Shortcuts)…");

    if (typeof enabled === "boolean") {
        document.body.classList.toggle(`state-on`, enabled);
        document.body.classList.toggle(`state-off`, !enabled);
    } else {
        document.body.classList.remove(`state-on`);
        document.body.classList.remove(`state-off`);
    }
}

function openPreferences() {
    webkit.messageHandlers.controller.postMessage("open-preferences");
}

document.querySelector("button.open-preferences").addEventListener("click", openPreferences);
