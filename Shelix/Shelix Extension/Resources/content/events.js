function initializeShelixEventHandlers() {
    document.addEventListener("keydown", (event) => {
        if (event.defaultPrevented || event.isComposing) {
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
    });

    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState !== "visible") {
            clearScrollKeys();
            clearPendingPrefix();
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
}
