import "./constants.js";

const shelixShared = globalThis.ShelixShared;
if (!shelixShared) {
    throw new Error("Shelix shared constants must load before popup script.");
}

const { SETTINGS_MESSAGE_TYPE, DEFAULT_TOGGLE_SHORTCUT } = shelixShared;

const title = browser.i18n.getMessage("extension_name");
const titleElement = document.getElementById("title");
const enabledToggle = document.getElementById("enabled-toggle");
const shortcutValueElement = document.getElementById("shortcut-value");
const recordShortcutButton = document.getElementById("record-shortcut");
const resetShortcutButton = document.getElementById("reset-shortcut");

const popupState = {
    isRecordingShortcut: false,
    enabled: true,
    toggleShortcut: { ...DEFAULT_TOGGLE_SHORTCUT }
};

if (title && titleElement) {
    titleElement.textContent = title;
    document.title = title;
}

function normalizeShortcutCandidate(candidate) {
    if (!candidate || typeof candidate !== "object" || typeof candidate.key !== "string") {
        return null;
    }

    const key = candidate.key.trim().toLowerCase();
    if (!key) {
        return null;
    }

    const normalized = {
        metaKey: Boolean(candidate.metaKey),
        ctrlKey: Boolean(candidate.ctrlKey),
        altKey: Boolean(candidate.altKey),
        shiftKey: Boolean(candidate.shiftKey),
        key
    };

    if (!normalized.metaKey && !normalized.ctrlKey && !normalized.altKey) {
        return null;
    }

    return normalized;
}

function formatShortcutKey(key) {
    if (key === " ") {
        return "Space";
    }

    if (key.length === 1) {
        return key.toUpperCase();
    }

    return key.charAt(0).toUpperCase() + key.slice(1);
}

function formatShortcut(shortcut) {
    const normalized = normalizeShortcutCandidate(shortcut) || DEFAULT_TOGGLE_SHORTCUT;
    const parts = [];
    if (normalized.metaKey) {
        parts.push("Command");
    }
    if (normalized.ctrlKey) {
        parts.push("Control");
    }
    if (normalized.altKey) {
        parts.push("Option");
    }
    if (normalized.shiftKey) {
        parts.push("Shift");
    }
    parts.push(formatShortcutKey(normalized.key));
    return parts.join(" + ");
}

function renderPopupState() {
    if (enabledToggle) {
        enabledToggle.checked = popupState.enabled;
    }

    if (shortcutValueElement) {
        shortcutValueElement.textContent = formatShortcut(popupState.toggleShortcut);
    }

    if (!recordShortcutButton) {
        return;
    }

    recordShortcutButton.textContent = popupState.isRecordingShortcut
        ? "Press New Shortcut..."
        : "Record Shortcut";
}

function applyIncomingSettings(settings) {
    if (!settings || typeof settings !== "object") {
        return;
    }

    if (typeof settings.enabled === "boolean") {
        popupState.enabled = settings.enabled;
    }

    const normalizedShortcut = normalizeShortcutCandidate(settings.toggleShortcut);
    if (normalizedShortcut) {
        popupState.toggleShortcut = normalizedShortcut;
    }
}

async function loadSettings() {
    const response = await browser.runtime.sendMessage({
        type: SETTINGS_MESSAGE_TYPE.GET
    }).catch(() => null);

    if (!response?.ok || !response.settings) {
        renderPopupState();
        return;
    }

    applyIncomingSettings(response.settings);
    renderPopupState();
}

function isModifierOnlyKey(key) {
    return key === "meta"
        || key === "control"
        || key === "alt"
        || key === "shift";
}

function eventToShortcutCandidate(event) {
    const key = event.key.toLowerCase();
    if (isModifierOnlyKey(key)) {
        return null;
    }

    return normalizeShortcutCandidate({
        metaKey: event.metaKey,
        ctrlKey: event.ctrlKey,
        altKey: event.altKey,
        shiftKey: event.shiftKey,
        key
    });
}

async function setEnabled(enabled) {
    const response = await browser.runtime.sendMessage({
        type: SETTINGS_MESSAGE_TYPE.SET_ENABLED,
        enabled
    }).catch(() => null);

    if (!response?.ok || !response.settings) {
        return;
    }

    applyIncomingSettings(response.settings);
    renderPopupState();
}

async function setToggleShortcut(shortcut) {
    const response = await browser.runtime.sendMessage({
        type: SETTINGS_MESSAGE_TYPE.SET_TOGGLE_SHORTCUT,
        shortcut
    }).catch(() => null);

    if (!response?.ok || !response.settings) {
        return;
    }

    applyIncomingSettings(response.settings);
    renderPopupState();
}

if (enabledToggle) {
    enabledToggle.addEventListener("change", () => {
        void setEnabled(enabledToggle.checked);
    });
}

if (recordShortcutButton) {
    recordShortcutButton.addEventListener("click", () => {
        popupState.isRecordingShortcut = !popupState.isRecordingShortcut;
        renderPopupState();
    });
}

if (resetShortcutButton) {
    resetShortcutButton.addEventListener("click", () => {
        void setToggleShortcut(DEFAULT_TOGGLE_SHORTCUT);
    });
}

window.addEventListener("keydown", (event) => {
    if (!popupState.isRecordingShortcut) {
        return;
    }

    event.preventDefault();

    const shortcut = eventToShortcutCandidate(event);
    if (!shortcut) {
        return;
    }

    popupState.isRecordingShortcut = false;
    renderPopupState();
    void setToggleShortcut(shortcut);
}, { capture: true });

browser.runtime.onMessage.addListener((message) => {
    if (message?.type !== SETTINGS_MESSAGE_TYPE.UPDATED || !message.settings) {
        return;
    }

    applyIncomingSettings(message.settings);
    renderPopupState();
});

void loadSettings();
