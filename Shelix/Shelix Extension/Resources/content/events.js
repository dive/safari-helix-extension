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

function applyIncomingSettings(settings) {
    if (!settings || typeof settings !== "object") {
        return;
    }

    if (typeof settings.enabled === "boolean") {
        state.extensionEnabled = settings.enabled;
    }

    const normalizedShortcut = normalizeShortcutCandidate(settings.toggleShortcut);
    if (normalizedShortcut) {
        state.toggleShortcut = normalizedShortcut;
    }
}

function matchesToggleShortcut(event) {
    const shortcut = normalizeShortcutCandidate(state.toggleShortcut) || DEFAULT_TOGGLE_SHORTCUT;
    const key = normalizeKey(event);

    return key === shortcut.key
        && event.metaKey === shortcut.metaKey
        && event.ctrlKey === shortcut.ctrlKey
        && event.altKey === shortcut.altKey
        && event.shiftKey === shortcut.shiftKey;
}

function resetShelixInteractiveState() {
    clearScrollKeys();
    clearPendingPrefix();
    hideKeyHintPopup();
    hideLinkHints();
    closeFindUi();
    clearFindResults();
    updateFindUiState("");

    if (state.mode === "insert") {
        exitInsertMode();
    }

    setMode("normal");
    runAction(ACTION.INPUT_CLEAR_HIGHLIGHT);
}

function requestToggleEnabledState() {
    browser.runtime.sendMessage({
        type: SETTINGS_MESSAGE_TYPE.TOGGLE_ENABLED
    }).then((response) => {
        if (!response?.ok || !response.settings) {
            return;
        }

        applyIncomingSettings(response.settings);
        if (!state.extensionEnabled) {
            resetShelixInteractiveState();
        }
    }).catch(() => {
        // The extension may be reloading.
    });
}

function handleIncomingSettingsMessage(message) {
    if (message?.type !== SETTINGS_MESSAGE_TYPE.UPDATED || !message.settings) {
        return;
    }

    applyIncomingSettings(message.settings);
    if (!state.extensionEnabled) {
        resetShelixInteractiveState();
    }
}

function syncSettingsFromBackground() {
    browser.runtime.sendMessage({
        type: SETTINGS_MESSAGE_TYPE.GET
    }).then((response) => {
        if (!response?.ok || !response.settings) {
            return;
        }

        applyIncomingSettings(response.settings);
        if (!state.extensionEnabled) {
            resetShelixInteractiveState();
        }
    }).catch(() => {
        // The extension may be reloading.
    });
}

function initializeShelixEventHandlers() {
    browser.runtime.onMessage.addListener(handleIncomingSettingsMessage);
    syncSettingsFromBackground();

    document.addEventListener("keydown", (event) => {
        if (event.isComposing) {
            return;
        }

        if (matchesToggleShortcut(event)) {
            event.preventDefault();
            requestToggleEnabledState();
            return;
        }

        if (!state.extensionEnabled || event.defaultPrevented) {
            return;
        }

        if (event.metaKey || event.altKey) {
            return;
        }

        if (isTargetInsideFindUi(event.target)) {
            return;
        }

        if (state.mode === "insert" && !isEditableTarget(document.activeElement)) {
            setMode("normal");
        }

        const key = normalizeKey(event);

        if (key === "escape" && isFindUiOpen()) {
            event.preventDefault();
            closeFindUi();
            return;
        }

        if (isLinkHintModeActive()) {
            event.preventDefault();
            if (key === "escape") {
                hideLinkHints();
            } else if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
                handleLinkHintInput(key);
            }
            return;
        }

        if (event.ctrlKey) {
            if (state.mode !== "normal" || isEditableTarget(event.target)) {
                return;
            }

            if (state.keyHintMode === "help") {
                hideKeyHintPopup();
            }

            if (key === "u") {
                event.preventDefault();
                runAction(ACTION.SCROLL_HALF_PAGE_UP);
            } else if (key === "d") {
                event.preventDefault();
                runAction(ACTION.SCROLL_HALF_PAGE_DOWN);
            } else if (key === "b") {
                event.preventDefault();
                runAction(ACTION.SCROLL_PAGE_UP);
            } else if (key === "f") {
                event.preventDefault();
                runAction(ACTION.SCROLL_PAGE_DOWN);
            } else if (key === "o") {
                event.preventDefault();
                runAction(ACTION.HISTORY_BACK);
            } else if (key === "i") {
                event.preventDefault();
                runAction(ACTION.HISTORY_FORWARD);
            }

            return;
        }

        if (handlePendingPrefix(event, key)) {
            return;
        }

        if (state.keyHintMode === "help" && key !== "?" && key !== "escape") {
            hideKeyHintPopup();
        }

        if (key === "escape" && state.mode === "insert") {
            event.preventDefault();
            exitInsertMode();
            return;
        }

        if (key === "escape" && state.mode === "normal") {
            event.preventDefault();
            if (state.keyHintMode === "help") {
                hideKeyHintPopup();
            }
            clearFindResults();
            updateFindUiState("");
            runAction(ACTION.INPUT_CLEAR_HIGHLIGHT);
            return;
        }

        if (state.mode !== "normal") {
            return;
        }

        if (isEditableTarget(event.target)) {
            return;
        }

        const action = NORMAL_MODE_ACTIONS[getActionKey(event)];
        if (!action) {
            return;
        }

        event.preventDefault();
        runAction(action);
    }, {
        capture: true
    });

    document.addEventListener("keyup", (event) => {
        if (!state.extensionEnabled) {
            return;
        }

        if (isTargetInsideFindUi(event.target)) {
            return;
        }

        const key = normalizeKey(event);
        if (key === "j") {
            state.isJPressed = false;
        } else if (key === "k") {
            state.isKPressed = false;
        } else {
            return;
        }

        if (getActiveScrollDirection() === 0) {
            stopScrollingLoop();
        }
    }, {
        capture: true
    });

    window.addEventListener("blur", () => {
        clearScrollKeys();
        clearPendingPrefix();
        if (isLinkHintModeActive()) {
            hideLinkHints();
        }
    });

    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState !== "visible") {
            clearScrollKeys();
            clearPendingPrefix();
            if (isLinkHintModeActive()) {
                hideLinkHints();
            }
        }
    });

    document.addEventListener("focusin", (event) => {
        const editableField = getEditableTarget(event.target);
        if (!editableField) {
            return;
        }

        enterInsertMode(editableField);
    }, {
        capture: true
    });

    document.addEventListener("focusout", () => {
        window.requestAnimationFrame(() => {
            if (state.mode === "insert" && !isEditableTarget(document.activeElement)) {
                setMode("normal");
            }
        });
    }, {
        capture: true
    });

    ensureReadingProgressBar();
}
