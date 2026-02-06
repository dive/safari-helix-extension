import "./constants.js";

const shelixShared = globalThis.ShelixShared;
if (!shelixShared) {
    throw new Error("Shelix shared constants must load before background script.");
}

const {
    TAB_ACTION_MESSAGE_TYPE,
    SETTINGS_MESSAGE_TYPE,
    DEFAULT_TOGGLE_SHORTCUT,
    TAB_ACTION
} = shelixShared;

const SETTINGS_STORAGE_KEYS = Object.freeze({
    enabled: "settings.enabled",
    toggleShortcut: "settings.toggleShortcut"
});

const settingsState = {
    loaded: false,
    enabled: true,
    toggleShortcut: { ...DEFAULT_TOGGLE_SHORTCUT }
};

browser.runtime.onInstalled.addListener(() => {
    console.log("Shelix extension installed.");
});

function getPublicSettings() {
    return {
        enabled: settingsState.enabled,
        toggleShortcut: { ...settingsState.toggleShortcut }
    };
}

function normalizeShortcutCandidate(candidate) {
    if (!candidate || typeof candidate !== "object") {
        return null;
    }

    if (typeof candidate.key !== "string") {
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

async function loadSettings() {
    if (settingsState.loaded) {
        return;
    }

    try {
        const persisted = await browser.storage.local.get([
            SETTINGS_STORAGE_KEYS.enabled,
            SETTINGS_STORAGE_KEYS.toggleShortcut
        ]);

        if (typeof persisted[SETTINGS_STORAGE_KEYS.enabled] === "boolean") {
            settingsState.enabled = persisted[SETTINGS_STORAGE_KEYS.enabled];
        }

        const normalizedShortcut = normalizeShortcutCandidate(persisted[SETTINGS_STORAGE_KEYS.toggleShortcut]);
        if (normalizedShortcut) {
            settingsState.toggleShortcut = normalizedShortcut;
        }
    } catch (error) {
        console.error("Shelix settings load failed:", error);
    } finally {
        settingsState.loaded = true;
    }
}

async function persistSettings() {
    await browser.storage.local.set({
        [SETTINGS_STORAGE_KEYS.enabled]: settingsState.enabled,
        [SETTINGS_STORAGE_KEYS.toggleShortcut]: settingsState.toggleShortcut
    });
}

async function broadcastSettings() {
    const settings = getPublicSettings();
    const tabs = await browser.tabs.query({});
    await Promise.all(tabs.map((tab) => {
        if (tab.id === undefined) {
            return Promise.resolve();
        }

        return browser.tabs.sendMessage(tab.id, {
            type: SETTINGS_MESSAGE_TYPE.UPDATED,
            settings
        }).catch(() => {
            // Ignore tabs without an active content script context.
        });
    }));
}

async function updateEnabled(nextEnabled) {
    await loadSettings();
    if (settingsState.enabled === nextEnabled) {
        return getPublicSettings();
    }

    settingsState.enabled = nextEnabled;
    await persistSettings();
    await broadcastSettings();
    return getPublicSettings();
}

async function toggleEnabled() {
    await loadSettings();
    return updateEnabled(!settingsState.enabled);
}

async function updateToggleShortcut(nextShortcut) {
    await loadSettings();

    const normalizedShortcut = normalizeShortcutCandidate(nextShortcut);
    if (!normalizedShortcut) {
        return null;
    }

    settingsState.toggleShortcut = normalizedShortcut;
    await persistSettings();
    await broadcastSettings();
    return getPublicSettings();
}

async function getCurrentTab(sender) {
    if (sender?.tab?.id !== undefined) {
        return sender.tab;
    }

    const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true
    });

    return tabs[0] || null;
}

async function switchTab(sender, direction) {
    const currentTab = await getCurrentTab(sender);
    if (!currentTab || currentTab.id === undefined || currentTab.windowId === undefined) {
        return;
    }

    const tabs = await browser.tabs.query({
        windowId: currentTab.windowId
    });

    if (tabs.length < 2) {
        return;
    }

    const orderedTabs = tabs.slice().sort((first, second) => first.index - second.index);
    const currentIndex = orderedTabs.findIndex((tab) => tab.id === currentTab.id);
    if (currentIndex === -1) {
        return;
    }

    const nextIndex = (currentIndex + direction + orderedTabs.length) % orderedTabs.length;
    const targetTab = orderedTabs[nextIndex];
    if (targetTab?.id === undefined) {
        return;
    }

    await browser.tabs.update(targetTab.id, {
        active: true
    });
}

async function createTab(sender) {
    const currentTab = await getCurrentTab(sender);
    const createProperties = {
        active: true
    };

    if (currentTab?.windowId !== undefined) {
        createProperties.windowId = currentTab.windowId;
    }

    if (typeof currentTab?.index === "number") {
        createProperties.index = currentTab.index + 1;
    }

    await browser.tabs.create(createProperties);
}

async function closeTab(sender) {
    const currentTab = await getCurrentTab(sender);
    if (!currentTab || currentTab.id === undefined) {
        return;
    }

    await browser.tabs.remove(currentTab.id);
}

async function duplicateTab(sender) {
    const currentTab = await getCurrentTab(sender);
    if (!currentTab || currentTab.id === undefined) {
        return;
    }

    await browser.tabs.duplicate(currentTab.id);
}

const TAB_ACTION_HANDLERS = Object.freeze({
    [TAB_ACTION.NEXT]: (sender) => switchTab(sender, 1),
    [TAB_ACTION.PREVIOUS]: (sender) => switchTab(sender, -1),
    [TAB_ACTION.NEW]: (sender) => createTab(sender),
    [TAB_ACTION.CLOSE]: (sender) => closeTab(sender),
    [TAB_ACTION.DUPLICATE]: (sender) => duplicateTab(sender)
});

browser.commands.onCommand.addListener((command) => {
    if (command !== "toggle-enabled") {
        return;
    }

    toggleEnabled().catch((error) => {
        console.error("Shelix command toggle failed:", error);
    });
});

browser.runtime.onMessage.addListener(async (message, sender) => {
    if (message?.type === SETTINGS_MESSAGE_TYPE.GET) {
        await loadSettings();
        return {
            ok: true,
            settings: getPublicSettings()
        };
    }

    if (message?.type === SETTINGS_MESSAGE_TYPE.TOGGLE_ENABLED) {
        try {
            const settings = await toggleEnabled();
            return {
                ok: true,
                settings
            };
        } catch (error) {
            console.error("Shelix toggle enabled failed:", error);
            return {
                ok: false
            };
        }
    }

    if (message?.type === SETTINGS_MESSAGE_TYPE.SET_ENABLED) {
        if (typeof message.enabled !== "boolean") {
            return {
                ok: false
            };
        }

        try {
            const settings = await updateEnabled(message.enabled);
            return {
                ok: true,
                settings
            };
        } catch (error) {
            console.error("Shelix set enabled failed:", error);
            return {
                ok: false
            };
        }
    }

    if (message?.type === SETTINGS_MESSAGE_TYPE.SET_TOGGLE_SHORTCUT) {
        try {
            const settings = await updateToggleShortcut(message.shortcut);
            return {
                ok: Boolean(settings),
                settings: settings || undefined
            };
        } catch (error) {
            console.error("Shelix set shortcut failed:", error);
            return {
                ok: false
            };
        }
    }

    if (message?.type !== TAB_ACTION_MESSAGE_TYPE) {
        return null;
    }

    const handler = TAB_ACTION_HANDLERS[message.action];
    if (!handler) {
        return {
            ok: false
        };
    }

    try {
        await handler(sender);
        return {
            ok: true
        };
    } catch (error) {
        console.error("Shelix tab action failed:", error);
        return {
            ok: false
        };
    }
});

void loadSettings();
