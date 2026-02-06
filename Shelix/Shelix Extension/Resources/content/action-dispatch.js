function clearPendingPrefix() {
    state.pendingPrefixKey = null;
    hideKeyHintPopup();
}

function armPrefix(prefixKey) {
    clearPendingPrefix();
    state.pendingPrefixKey = prefixKey;
    showPrefixKeyHint(prefixKey);
}

function requestTabAction(action) {
    browser.runtime.sendMessage({
        type: TAB_ACTION_MESSAGE_TYPE,
        action
    }).catch(() => {
        // Background script may be unavailable briefly during extension reloads.
    });
}

var ACTION_HANDLERS = Object.freeze({
    [ACTION.SCROLL_DOWN_START]: () => {
        state.isJPressed = true;
        ensureScrollingLoop();
    },
    [ACTION.SCROLL_UP_START]: () => {
        state.isKPressed = true;
        ensureScrollingLoop();
    },
    [ACTION.SCROLL_TOP]: () => {
        clearScrollKeys();
        window.scrollTo({
            left: 0,
            top: 0,
            behavior: "auto"
        });
    },
    [ACTION.SCROLL_BOTTOM]: () => {
        clearScrollKeys();
        const scrollingElement = document.scrollingElement || document.documentElement;
        window.scrollTo({
            left: 0,
            top: scrollingElement.scrollHeight,
            behavior: "auto"
        });
    },
    [ACTION.SCROLL_HALF_PAGE_UP]: () => {
        clearScrollKeys();
        runDiscreteScroll(-Math.max(1, window.innerHeight / 2));
    },
    [ACTION.SCROLL_HALF_PAGE_DOWN]: () => {
        clearScrollKeys();
        runDiscreteScroll(Math.max(1, window.innerHeight / 2));
    },
    [ACTION.SCROLL_PAGE_UP]: () => {
        clearScrollKeys();
        runDiscreteScroll(-Math.max(1, window.innerHeight));
    },
    [ACTION.SCROLL_PAGE_DOWN]: () => {
        clearScrollKeys();
        runDiscreteScroll(Math.max(1, window.innerHeight));
    },
    [ACTION.HISTORY_BACK]: () => {
        history.back();
    },
    [ACTION.HISTORY_FORWARD]: () => {
        history.forward();
    },
    [ACTION.LINK_HINT_SHOW]: () => {
        showLinkHints();
    },
    [ACTION.FIND_OPEN]: () => {
        clearScrollKeys();
        openFindUi();
    },
    [ACTION.FIND_NEXT]: () => {
        runFindNavigation(false);
    },
    [ACTION.FIND_PREVIOUS]: () => {
        runFindNavigation(true);
    },
    [ACTION.HELP_SHOW]: () => {
        if (state.keyHintMode === "help") {
            hideKeyHintPopup();
            return;
        }

        clearPendingPrefix();
        showHelpKeyHint();
    },
    [ACTION.INPUT_PREVIOUS]: () => {
        highlightRelativeField(-1);
    },
    [ACTION.INPUT_NEXT]: () => {
        highlightRelativeField(1);
    },
    [ACTION.INPUT_INSERT_HIGHLIGHTED]: () => {
        const field = ensureHighlightedField();
        if (field) {
            enterInsertMode(field);
        }
    },
    [ACTION.INPUT_INSERT_FIRST]: () => {
        const fields = getNavigableFields();
        const field = getHighlightedField(fields) || fields[0] || null;
        if (field) {
            enterInsertMode(field);
        }
    },
    [ACTION.INPUT_CLEAR_HIGHLIGHT]: () => {
        setHighlightedField(null);
    },
    [ACTION.TAB_NEXT]: () => {
        requestTabAction(TAB_ACTION.NEXT);
    },
    [ACTION.TAB_PREVIOUS]: () => {
        requestTabAction(TAB_ACTION.PREVIOUS);
    },
    [ACTION.TAB_NEW]: () => {
        requestTabAction(TAB_ACTION.NEW);
    },
    [ACTION.TAB_CLOSE]: () => {
        requestTabAction(TAB_ACTION.CLOSE);
    },
    [ACTION.TAB_DUPLICATE]: () => {
        requestTabAction(TAB_ACTION.DUPLICATE);
    },
    [ACTION.PREFIX_G]: () => {
        armPrefix("g");
    },
    [ACTION.PREFIX_SPACE]: () => {
        armPrefix(" ");
    }
});

function runAction(action) {
    const handler = ACTION_HANDLERS[action];
    if (!handler) {
        return;
    }

    handler();
}

function handlePendingPrefix(event, key) {
    if (!state.pendingPrefixKey) {
        return false;
    }

    if (key === "shift") {
        return true;
    }

    if (key === "escape") {
        event.preventDefault();
        clearPendingPrefix();
        return true;
    }

    const prefixMap = PREFIX_ACTIONS[state.pendingPrefixKey] || null;
    const action = prefixMap ? prefixMap[key] : null;

    clearPendingPrefix();
    event.preventDefault();

    if (!action) {
        return true;
    }

    runAction(action);
    return true;
}
