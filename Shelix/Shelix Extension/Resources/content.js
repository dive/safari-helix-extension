// Shelix content script entry point.

const INPUT_FIELD_SELECTOR = [
    "input:not([type])",
    "input[type='text']",
    "input[type='search']",
    "input[type='email']",
    "input[type='password']",
    "input[type='url']",
    "input[type='tel']",
    "input[type='number']",
    "textarea",
    "[contenteditable='']",
    "[contenteditable='true']",
    "[contenteditable='plaintext-only']"
].join(",");

const SCROLL_PIXELS_PER_SECOND = 1200;
const INPUT_HIGHLIGHT_CLASS = "shelix-input-highlight";
const INPUT_HIGHLIGHT_STYLE_ID = "shelix-input-highlight-style";
const KEY_HINT_STYLE_ID = "shelix-key-hint-style";
const KEY_HINT_CONTAINER_ID = "shelix-key-hint";

const TAB_ACTION_MESSAGE_TYPE = "shelix.tabAction";
const TAB_ACTION = Object.freeze({
    NEXT: "next",
    PREVIOUS: "previous",
    NEW: "new",
    CLOSE: "close",
    DUPLICATE: "duplicate"
});

const ACTION = Object.freeze({
    SCROLL_DOWN_START: "scroll.down.start",
    SCROLL_UP_START: "scroll.up.start",
    SCROLL_TOP: "scroll.top",
    SCROLL_BOTTOM: "scroll.bottom",
    SCROLL_HALF_PAGE_UP: "scroll.halfPage.up",
    SCROLL_HALF_PAGE_DOWN: "scroll.halfPage.down",
    FIND_OPEN: "find.open",
    FIND_NEXT: "find.next",
    FIND_PREVIOUS: "find.previous",
    HELP_SHOW: "help.show",
    INPUT_PREVIOUS: "input.previous",
    INPUT_NEXT: "input.next",
    INPUT_INSERT_HIGHLIGHTED: "input.insert.highlighted",
    INPUT_INSERT_FIRST: "input.insert.first",
    INPUT_CLEAR_HIGHLIGHT: "input.clearHighlight",
    TAB_NEXT: "tab.next",
    TAB_PREVIOUS: "tab.previous",
    TAB_NEW: "tab.new",
    TAB_CLOSE: "tab.close",
    TAB_DUPLICATE: "tab.duplicate",
    PREFIX_G: "prefix.g",
    PREFIX_SPACE: "prefix.space"
});

const NORMAL_MODE_ACTIONS = Object.freeze({
    j: ACTION.SCROLL_DOWN_START,
    k: ACTION.SCROLL_UP_START,
    "/": ACTION.FIND_OPEN,
    n: ACTION.FIND_NEXT,
    "shift+n": ACTION.FIND_PREVIOUS,
    "?": ACTION.HELP_SHOW,
    h: ACTION.INPUT_PREVIOUS,
    l: ACTION.INPUT_NEXT,
    enter: ACTION.INPUT_INSERT_HIGHLIGHTED,
    i: ACTION.INPUT_INSERT_FIRST,
    g: ACTION.PREFIX_G,
    " ": ACTION.PREFIX_SPACE
});

const PREFIX_ACTIONS = Object.freeze({
    g: Object.freeze({
        g: ACTION.SCROLL_TOP,
        e: ACTION.SCROLL_BOTTOM,
        n: ACTION.TAB_NEXT,
        p: ACTION.TAB_PREVIOUS
    }),
    " ": Object.freeze({
        n: ACTION.TAB_NEW,
        q: ACTION.TAB_CLOSE,
        d: ACTION.TAB_DUPLICATE,
        "?": ACTION.HELP_SHOW
    })
});

const PREFIX_TITLES = Object.freeze({
    g: "Goto",
    " ": "Space"
});

const ACTION_LABELS = Object.freeze({
    [ACTION.SCROLL_TOP]: "Top of page",
    [ACTION.SCROLL_BOTTOM]: "Bottom of page",
    [ACTION.SCROLL_HALF_PAGE_UP]: "Half page up",
    [ACTION.SCROLL_HALF_PAGE_DOWN]: "Half page down",
    [ACTION.FIND_OPEN]: "Find in page",
    [ACTION.FIND_NEXT]: "Find next match",
    [ACTION.FIND_PREVIOUS]: "Find previous match",
    [ACTION.HELP_SHOW]: "Show keymap",
    [ACTION.TAB_NEXT]: "Next tab",
    [ACTION.TAB_PREVIOUS]: "Previous tab",
    [ACTION.TAB_NEW]: "New tab",
    [ACTION.TAB_CLOSE]: "Close tab",
    [ACTION.TAB_DUPLICATE]: "Duplicate tab"
});

const HELP_KEY_HINT_ROWS = Object.freeze([
    Object.freeze({ key: "j / k", label: "Scroll down / up" }),
    Object.freeze({ key: "Ctrl-d / Ctrl-u", label: "Half page down / up" }),
    Object.freeze({ key: "g g / g e", label: "Top / bottom of page" }),
    Object.freeze({ key: "/, n, N", label: "Find in page and jump matches" }),
    Object.freeze({ key: "h / l", label: "Previous / next input field" }),
    Object.freeze({ key: "Enter / i", label: "Enter Insert mode" }),
    Object.freeze({ key: "Esc", label: "Exit Insert or clear highlight" }),
    Object.freeze({ key: "g n / g p", label: "Next / previous tab" }),
    Object.freeze({ key: "Space n", label: "New tab" }),
    Object.freeze({ key: "Space q", label: "Close tab" }),
    Object.freeze({ key: "Space d", label: "Duplicate tab" }),
    Object.freeze({ key: "? / Space ?", label: "Show keymap" })
]);

let scrollAnimationFrame = null;
let lastScrollFrameTime = 0;
let isJPressed = false;
let isKPressed = false;
let highlightedField = null;
let mode = "normal";
let pendingPrefixKey = null;
let lastFindQuery = "";
let keyHintMode = "hidden";

function normalizeKey(event) {
    return event.key.length === 1 ? event.key.toLowerCase() : event.key.toLowerCase();
}

function getActionKey(event) {
    const key = normalizeKey(event);
    if (event.shiftKey && key.length === 1 && key >= "a" && key <= "z") {
        return `shift+${key}`;
    }

    return key;
}

function formatKeyLabel(key) {
    if (key === " ") {
        return "Space";
    }

    if (key === "enter") {
        return "Enter";
    }

    if (key === "escape") {
        return "Esc";
    }

    return key;
}

function ensureHighlightStyle() {
    if (document.getElementById(INPUT_HIGHLIGHT_STYLE_ID)) {
        return;
    }

    const styleElement = document.createElement("style");
    styleElement.id = INPUT_HIGHLIGHT_STYLE_ID;
    styleElement.textContent = `
        .${INPUT_HIGHLIGHT_CLASS} {
            outline: none !important;
            border-color: #ff7a00 !important;
            box-shadow: inset 0 0 0 1px #ff7a00, 0 0 0 1px rgba(255, 122, 0, 0.2) !important;
        }
    `;

    (document.head || document.documentElement).appendChild(styleElement);
}

function ensureKeyHintStyle() {
    if (document.getElementById(KEY_HINT_STYLE_ID)) {
        return;
    }

    const styleElement = document.createElement("style");
    styleElement.id = KEY_HINT_STYLE_ID;
    styleElement.textContent = `
        #${KEY_HINT_CONTAINER_ID} {
            position: fixed;
            right: 18px;
            bottom: 18px;
            z-index: 2147483647;
            min-width: 380px;
            max-width: min(88vw, 760px);
            padding: 12px 14px 10px;
            border: 1px solid GrayText;
            border-radius: 0;
            background: Canvas;
            color: CanvasText;
            font: menu;
            line-height: 1.25;
            letter-spacing: 0;
            box-shadow: none;
            pointer-events: none;
            color-scheme: light dark;
        }

        #${KEY_HINT_CONTAINER_ID}[hidden] {
            display: none !important;
        }

        #${KEY_HINT_CONTAINER_ID} * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font: inherit;
            color: inherit;
        }

        #${KEY_HINT_CONTAINER_ID} .shelix-key-hint-title {
            margin-bottom: 6px;
            font-weight: 600;
            line-height: 1;
        }

        #${KEY_HINT_CONTAINER_ID} .shelix-key-hint-row {
            display: grid;
            grid-template-columns: 2ch minmax(0, 1fr);
            align-items: baseline;
            column-gap: 12px;
            margin-top: 2px;
        }

        #${KEY_HINT_CONTAINER_ID} .shelix-key-hint-row:nth-child(2) {
            margin-top: 0;
        }

        #${KEY_HINT_CONTAINER_ID} .shelix-key-hint-key {
            font-weight: 600;
        }

        #${KEY_HINT_CONTAINER_ID} .shelix-key-hint-label {
            text-align: left;
            white-space: pre-wrap;
        }
    `;

    (document.head || document.documentElement).appendChild(styleElement);
}

function getKeyHintContainer() {
    let container = document.getElementById(KEY_HINT_CONTAINER_ID);
    if (container) {
        return container;
    }

    ensureKeyHintStyle();

    container = document.createElement("div");
    container.id = KEY_HINT_CONTAINER_ID;
    container.hidden = true;
    document.documentElement.appendChild(container);

    return container;
}

function hideKeyHintPopup() {
    const container = document.getElementById(KEY_HINT_CONTAINER_ID);
    if (container) {
        container.hidden = true;
    }

    keyHintMode = "hidden";
}

function showKeyHintPopup(title, rows) {
    if (rows.length === 0) {
        hideKeyHintPopup();
        return;
    }

    const container = getKeyHintContainer();
    container.innerHTML = `<div class="shelix-key-hint-title">${title}</div>${rows.map((row) => `
        <div class="shelix-key-hint-row">
            <span class="shelix-key-hint-key">${row.key}</span>
            <span class="shelix-key-hint-label">${row.label}</span>
        </div>
    `).join("")}`;
    container.hidden = false;
}

function showPrefixKeyHint(prefixKey) {
    const prefixMap = PREFIX_ACTIONS[prefixKey];
    if (!prefixMap) {
        hideKeyHintPopup();
        return;
    }

    const rows = Object.entries(prefixMap).map(([key, action]) => ({
        key: formatKeyLabel(key),
        label: ACTION_LABELS[action] || action
    }));
    const title = PREFIX_TITLES[prefixKey] || formatKeyLabel(prefixKey);
    showKeyHintPopup(title, rows);
    keyHintMode = "prefix";
}

function showHelpKeyHint() {
    showKeyHintPopup("Keymap", HELP_KEY_HINT_ROWS);
    keyHintMode = "help";
}

function getEditableTarget(target) {
    if (!(target instanceof Element)) {
        return null;
    }

    const editable = target.closest(INPUT_FIELD_SELECTOR);
    if (!editable) {
        return null;
    }

    if (editable instanceof HTMLInputElement || editable instanceof HTMLTextAreaElement) {
        if (editable.disabled || editable.readOnly) {
            return null;
        }
    }

    return editable;
}

function isEditableTarget(target) {
    return getEditableTarget(target) !== null;
}

function isNavigableField(field) {
    if (!(field instanceof HTMLElement)) {
        return false;
    }

    const style = window.getComputedStyle(field);
    if (style.display === "none" || style.visibility === "hidden") {
        return false;
    }

    if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
        if (field.disabled || field.readOnly) {
            return false;
        }
    }

    const rect = field.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
}

function getNavigableFields() {
    return Array.from(document.querySelectorAll(INPUT_FIELD_SELECTOR)).filter(isNavigableField);
}

function syncHighlightVisibility() {
    if (!highlightedField || !highlightedField.isConnected) {
        return;
    }

    if (mode === "normal") {
        highlightedField.classList.add(INPUT_HIGHLIGHT_CLASS);
    } else {
        highlightedField.classList.remove(INPUT_HIGHLIGHT_CLASS);
    }
}

function setMode(nextMode) {
    mode = nextMode;
    if (mode !== "normal") {
        clearPendingPrefix();
    }

    syncHighlightVisibility();
}

function setHighlightedField(field) {
    if (highlightedField && highlightedField.isConnected) {
        highlightedField.classList.remove(INPUT_HIGHLIGHT_CLASS);
    }

    highlightedField = field;

    if (highlightedField) {
        ensureHighlightStyle();
        syncHighlightVisibility();
    }
}

function getHighlightedField(fields) {
    if (!highlightedField || !highlightedField.isConnected || !isNavigableField(highlightedField)) {
        setHighlightedField(null);
        return null;
    }

    if (Array.isArray(fields) && !fields.includes(highlightedField)) {
        setHighlightedField(null);
        return null;
    }

    return highlightedField;
}

function ensureHighlightedField() {
    const fields = getNavigableFields();
    if (fields.length === 0) {
        setHighlightedField(null);
        return null;
    }

    const existingHighlightedField = getHighlightedField(fields);
    if (existingHighlightedField) {
        return existingHighlightedField;
    }

    const activeEditableField = getEditableTarget(document.activeElement);
    if (activeEditableField && fields.includes(activeEditableField)) {
        setHighlightedField(activeEditableField);
        return activeEditableField;
    }

    setHighlightedField(fields[0]);
    return fields[0];
}

function highlightRelativeField(direction) {
    const fields = getNavigableFields();
    if (fields.length === 0) {
        setHighlightedField(null);
        return;
    }

    const currentField = getHighlightedField(fields);
    const currentIndex = currentField ? fields.indexOf(currentField) : -1;
    const nextIndex = currentIndex === -1
        ? (direction > 0 ? 0 : fields.length - 1)
        : (currentIndex + direction + fields.length) % fields.length;

    const nextField = fields[nextIndex];
    setHighlightedField(nextField);
    nextField.scrollIntoView({
        block: "center",
        inline: "nearest"
    });
}

function enterInsertMode(field) {
    if (!isNavigableField(field)) {
        return;
    }

    setMode("insert");
    clearScrollKeys();
    setHighlightedField(field);
    field.focus({
        preventScroll: true
    });
}

function exitInsertMode() {
    const activeEditableField = getEditableTarget(document.activeElement);
    if (activeEditableField instanceof HTMLElement) {
        setHighlightedField(activeEditableField);
        activeEditableField.blur();
    }

    setMode("normal");
    clearScrollKeys();
}

function getActiveScrollDirection() {
    return (isJPressed ? 1 : 0) + (isKPressed ? -1 : 0);
}

function stopScrollingLoop() {
    if (scrollAnimationFrame !== null) {
        window.cancelAnimationFrame(scrollAnimationFrame);
        scrollAnimationFrame = null;
    }

    lastScrollFrameTime = 0;
}

function tickScroll(timestamp) {
    const direction = getActiveScrollDirection();
    if (direction === 0) {
        stopScrollingLoop();
        return;
    }

    if (lastScrollFrameTime === 0) {
        lastScrollFrameTime = timestamp;
    }

    const elapsedMs = Math.min(50, timestamp - lastScrollFrameTime);
    lastScrollFrameTime = timestamp;
    const distance = direction * SCROLL_PIXELS_PER_SECOND * (elapsedMs / 1000);

    window.scrollBy({
        left: 0,
        top: distance,
        behavior: "auto"
    });

    scrollAnimationFrame = window.requestAnimationFrame(tickScroll);
}

function ensureScrollingLoop() {
    if (getActiveScrollDirection() === 0 || scrollAnimationFrame !== null) {
        return;
    }

    scrollAnimationFrame = window.requestAnimationFrame(tickScroll);
}

function clearScrollKeys() {
    isJPressed = false;
    isKPressed = false;
    stopScrollingLoop();
}

function clearPendingPrefix() {
    pendingPrefixKey = null;
    hideKeyHintPopup();
}

function armPrefix(prefixKey) {
    clearPendingPrefix();
    pendingPrefixKey = prefixKey;
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

function findInPage(query, backwards) {
    if (typeof window.find !== "function") {
        return false;
    }

    return window.find(query, false, backwards, true, false, false, false);
}

function openFindPrompt() {
    const query = window.prompt("Find in page:", lastFindQuery);
    if (query === null) {
        return false;
    }

    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
        lastFindQuery = "";
        return false;
    }

    lastFindQuery = normalizedQuery;
    return true;
}

function runAction(action) {
    if (action === ACTION.SCROLL_DOWN_START) {
        isJPressed = true;
        ensureScrollingLoop();
        return;
    }

    if (action === ACTION.SCROLL_UP_START) {
        isKPressed = true;
        ensureScrollingLoop();
        return;
    }

    if (action === ACTION.SCROLL_TOP) {
        clearScrollKeys();
        window.scrollTo({
            left: 0,
            top: 0,
            behavior: "auto"
        });
        return;
    }

    if (action === ACTION.SCROLL_BOTTOM) {
        clearScrollKeys();
        const scrollingElement = document.scrollingElement || document.documentElement;
        window.scrollTo({
            left: 0,
            top: scrollingElement.scrollHeight,
            behavior: "auto"
        });
        return;
    }

    if (action === ACTION.SCROLL_HALF_PAGE_UP) {
        clearScrollKeys();
        window.scrollBy({
            left: 0,
            top: -Math.max(1, window.innerHeight / 2),
            behavior: "auto"
        });
        return;
    }

    if (action === ACTION.SCROLL_HALF_PAGE_DOWN) {
        clearScrollKeys();
        window.scrollBy({
            left: 0,
            top: Math.max(1, window.innerHeight / 2),
            behavior: "auto"
        });
        return;
    }

    if (action === ACTION.FIND_OPEN) {
        clearScrollKeys();
        if (openFindPrompt()) {
            findInPage(lastFindQuery, false);
        }

        return;
    }

    if (action === ACTION.FIND_NEXT) {
        if (lastFindQuery) {
            findInPage(lastFindQuery, false);
        }

        return;
    }

    if (action === ACTION.FIND_PREVIOUS) {
        if (lastFindQuery) {
            findInPage(lastFindQuery, true);
        }

        return;
    }

    if (action === ACTION.HELP_SHOW) {
        if (keyHintMode === "help") {
            hideKeyHintPopup();
            return;
        }

        clearPendingPrefix();
        showHelpKeyHint();
        return;
    }

    if (action === ACTION.INPUT_PREVIOUS) {
        highlightRelativeField(-1);
        return;
    }

    if (action === ACTION.INPUT_NEXT) {
        highlightRelativeField(1);
        return;
    }

    if (action === ACTION.INPUT_INSERT_HIGHLIGHTED) {
        const field = ensureHighlightedField();
        if (field) {
            enterInsertMode(field);
        }

        return;
    }

    if (action === ACTION.INPUT_INSERT_FIRST) {
        const fields = getNavigableFields();
        const field = getHighlightedField(fields) || fields[0] || null;
        if (field) {
            enterInsertMode(field);
        }

        return;
    }

    if (action === ACTION.INPUT_CLEAR_HIGHLIGHT) {
        setHighlightedField(null);
        return;
    }

    if (action === ACTION.TAB_NEXT) {
        requestTabAction(TAB_ACTION.NEXT);
        return;
    }

    if (action === ACTION.TAB_PREVIOUS) {
        requestTabAction(TAB_ACTION.PREVIOUS);
        return;
    }

    if (action === ACTION.TAB_NEW) {
        requestTabAction(TAB_ACTION.NEW);
        return;
    }

    if (action === ACTION.TAB_CLOSE) {
        requestTabAction(TAB_ACTION.CLOSE);
        return;
    }

    if (action === ACTION.TAB_DUPLICATE) {
        requestTabAction(TAB_ACTION.DUPLICATE);
        return;
    }

    if (action === ACTION.PREFIX_G) {
        armPrefix("g");
        return;
    }

    if (action === ACTION.PREFIX_SPACE) {
        armPrefix(" ");
    }
}

function handlePendingPrefix(event, key) {
    if (!pendingPrefixKey) {
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

    const prefixMap = PREFIX_ACTIONS[pendingPrefixKey] || null;
    const action = prefixMap ? prefixMap[key] : null;

    clearPendingPrefix();
    event.preventDefault();

    if (!action) {
        return true;
    }

    runAction(action);
    return true;
}

document.addEventListener("keydown", (event) => {
    if (event.defaultPrevented || event.isComposing) {
        return;
    }

    if (event.metaKey || event.altKey) {
        return;
    }

    if (mode === "insert" && !isEditableTarget(document.activeElement)) {
        setMode("normal");
    }

    const key = normalizeKey(event);

    if (event.ctrlKey) {
        if (mode !== "normal" || isEditableTarget(event.target)) {
            return;
        }

        if (keyHintMode === "help") {
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

    if (keyHintMode === "help" && key !== "?" && key !== "escape") {
        hideKeyHintPopup();
    }

    if (key === "escape" && mode === "insert") {
        event.preventDefault();
        exitInsertMode();
        return;
    }

    if (key === "escape" && mode === "normal") {
        event.preventDefault();
        if (keyHintMode === "help") {
            hideKeyHintPopup();
        }
        runAction(ACTION.INPUT_CLEAR_HIGHLIGHT);
        return;
    }

    if (mode !== "normal") {
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
    if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
    }

    const key = normalizeKey(event);
    if (key === "j") {
        isJPressed = false;
    } else if (key === "k") {
        isKPressed = false;
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

    setMode("insert");
    setHighlightedField(editableField);
}, {
    capture: true
});

document.addEventListener("focusout", () => {
    window.requestAnimationFrame(() => {
        if (mode === "insert" && !isEditableTarget(document.activeElement)) {
            setMode("normal");
        }
    });
}, {
    capture: true
});
