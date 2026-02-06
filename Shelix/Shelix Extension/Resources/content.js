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
const KEY_HINT_MIN_WIDTH_PX = 260;
const KEY_HINT_MAX_WIDTH_PX = 640;
const KEY_HINT_VIEWPORT_MARGIN_PX = 24;
const FIND_UI_STYLE_ID = "shelix-find-style";
const FIND_UI_CONTAINER_ID = "shelix-find";
const FIND_UI_INPUT_ID = "shelix-find-input";
const FIND_UI_STATUS_ID = "shelix-find-status";
const FIND_UI_PREVIOUS_BUTTON_ID = "shelix-find-previous";
const FIND_UI_NEXT_BUTTON_ID = "shelix-find-next";
const FIND_UI_DONE_BUTTON_ID = "shelix-find-done";
const FIND_HIGHLIGHT_MATCH_NAME = "shelix-find-match";
const FIND_HIGHLIGHT_ACTIVE_NAME = "shelix-find-active";
const FIND_FALLBACK_MATCH_CLASS = "shelix-find-highlight-match";
const FIND_FALLBACK_ACTIVE_CLASS = "shelix-find-highlight-active";
const FIND_MATCH_LIMIT = 2000;
const FIND_EXCLUDED_SEARCH_ANCESTOR_SELECTOR = "script, style, noscript, textarea, option";

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
let activeFindQuery = "";
let activeFindMatchIndex = -1;
let findMatches = [];
let didTruncateFindMatches = false;
let findUsesCustomHighlights = false;
let keyHintMode = "hidden";
let pendingFindUiSearchFrame = null;
let pendingFindUiSearchRequest = null;

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
            min-width: 0;
            width: auto;
            max-width: calc(100vw - ${KEY_HINT_VIEWPORT_MARGIN_PX}px);
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
            max-height: min(70vh, 620px);
            overflow: auto;
            overscroll-behavior: contain;
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

        #${KEY_HINT_CONTAINER_ID} .shelix-key-hint-rows {
            display: grid;
            grid-template-columns: max-content minmax(0, 1fr);
            column-gap: 12px;
            row-gap: 4px;
            align-items: start;
        }

        #${KEY_HINT_CONTAINER_ID} .shelix-key-hint-key {
            font-weight: 600;
            white-space: nowrap;
        }

        #${KEY_HINT_CONTAINER_ID} .shelix-key-hint-label {
            text-align: left;
            white-space: normal;
        }
    `;

    (document.head || document.documentElement).appendChild(styleElement);
}

function ensureFindUiStyle() {
    if (document.getElementById(FIND_UI_STYLE_ID)) {
        return;
    }

    const styleElement = document.createElement("style");
    styleElement.id = FIND_UI_STYLE_ID;
    styleElement.textContent = `
        #${FIND_UI_CONTAINER_ID} {
            position: fixed;
            top: 12px;
            right: 12px;
            z-index: 2147483647;
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px;
            border: 1px solid GrayText;
            border-radius: 8px;
            background: Canvas;
            color: CanvasText;
            font: menu;
            line-height: 1.2;
            color-scheme: light dark;
            box-shadow: 0 3px 12px rgba(0, 0, 0, 0.18);
            max-width: calc(100vw - 24px);
        }

        #${FIND_UI_CONTAINER_ID}[hidden] {
            display: none !important;
        }

        #${FIND_UI_CONTAINER_ID} * {
            box-sizing: border-box;
            font: inherit;
        }

        #${FIND_UI_CONTAINER_ID} #${FIND_UI_INPUT_ID} {
            min-width: 18em;
            max-width: min(40em, 50vw);
            padding: 4px 6px;
            border: 1px solid GrayText;
            border-radius: 6px;
            background: Field;
            color: FieldText;
            font: inherit;
        }

        #${FIND_UI_CONTAINER_ID} #${FIND_UI_INPUT_ID}::placeholder {
            color: GrayText;
            opacity: 1;
        }

        #${FIND_UI_CONTAINER_ID} #${FIND_UI_STATUS_ID} {
            min-width: 9ch;
            text-align: right;
            white-space: nowrap;
            color: GrayText;
        }

        #${FIND_UI_CONTAINER_ID} #${FIND_UI_STATUS_ID}[data-state="error"] {
            color: LinkText;
        }

        #${FIND_UI_CONTAINER_ID} button {
            min-width: 2.2em;
            padding: 3px 7px;
            border: 1px solid GrayText;
            border-radius: 6px;
            background: ButtonFace;
            color: ButtonText;
            line-height: 1.1;
        }

        #${FIND_UI_CONTAINER_ID} button:disabled {
            opacity: 0.5;
        }

        ::highlight(${FIND_HIGHLIGHT_MATCH_NAME}) {
            background: Mark;
            color: MarkText;
        }

        ::highlight(${FIND_HIGHLIGHT_ACTIVE_NAME}) {
            background: Highlight;
            color: HighlightText;
        }

        .${FIND_FALLBACK_MATCH_CLASS} {
            background: Mark;
            color: MarkText;
        }

        .${FIND_FALLBACK_ACTIVE_CLASS} {
            background: Highlight;
            color: HighlightText;
        }
    `;

    (document.head || document.documentElement).appendChild(styleElement);
}

function isTargetInsideFindUi(target) {
    if (!(target instanceof Element)) {
        return false;
    }

    return Boolean(target.closest(`#${FIND_UI_CONTAINER_ID}`));
}

function isTargetInsideShelixUi(target) {
    if (!(target instanceof Element)) {
        return false;
    }

    return Boolean(target.closest(`#${FIND_UI_CONTAINER_ID}, #${KEY_HINT_CONTAINER_ID}`));
}

function getInputSelectionSnapshot(input) {
    return {
        start: input.selectionStart,
        end: input.selectionEnd,
        direction: input.selectionDirection
    };
}

function getFindUiElements(createIfMissing = false) {
    let container = document.getElementById(FIND_UI_CONTAINER_ID);
    if (!container && !createIfMissing) {
        return null;
    }

    if (!container) {
        ensureFindUiStyle();

        container = document.createElement("div");
        container.id = FIND_UI_CONTAINER_ID;
        container.hidden = true;

        const input = document.createElement("input");
        input.id = FIND_UI_INPUT_ID;
        input.type = "search";
        input.placeholder = "Find in page";
        input.autocomplete = "off";
        input.autocapitalize = "off";
        input.autocorrect = "off";
        input.spellcheck = false;
        input.setAttribute("aria-label", "Find in page");

        const status = document.createElement("span");
        status.id = FIND_UI_STATUS_ID;
        status.setAttribute("aria-live", "polite");

        const previousButton = document.createElement("button");
        previousButton.id = FIND_UI_PREVIOUS_BUTTON_ID;
        previousButton.type = "button";
        previousButton.textContent = "‹";
        previousButton.title = "Previous match (Shift+Enter)";
        previousButton.setAttribute("aria-label", "Previous match");

        const nextButton = document.createElement("button");
        nextButton.id = FIND_UI_NEXT_BUTTON_ID;
        nextButton.type = "button";
        nextButton.textContent = "›";
        nextButton.title = "Next match (Enter)";
        nextButton.setAttribute("aria-label", "Next match");

        const doneButton = document.createElement("button");
        doneButton.id = FIND_UI_DONE_BUTTON_ID;
        doneButton.type = "button";
        doneButton.textContent = "Done";

        container.append(input, status, previousButton, nextButton, doneButton);
        document.documentElement.appendChild(container);

        for (const button of [previousButton, nextButton, doneButton]) {
            button.addEventListener("mousedown", (event) => {
                event.preventDefault();
            });
        }

        input.addEventListener("input", () => {
            scheduleFindFromUi(input.value, false, true, getInputSelectionSnapshot(input));
        });

        input.addEventListener("search", () => {
            scheduleFindFromUi(input.value, false, true, getInputSelectionSnapshot(input));
        });

        input.addEventListener("keydown", (event) => {
            const key = normalizeKey(event);
            if (key === "enter") {
                event.preventDefault();
                runFindWithQueryFromUi(input.value, event.shiftKey, false, getInputSelectionSnapshot(input));
                return;
            }

            if (key === "escape") {
                event.preventDefault();
                closeFindUi();
                return;
            }

            if ((event.metaKey || event.ctrlKey) && key === "g") {
                event.preventDefault();
                runFindWithQueryFromUi(input.value, event.shiftKey, false, getInputSelectionSnapshot(input));
            }
        });

        previousButton.addEventListener("click", () => {
            runFindWithQueryFromUi(input.value, true, false, getInputSelectionSnapshot(input));
        });

        nextButton.addEventListener("click", () => {
            runFindWithQueryFromUi(input.value, false, false, getInputSelectionSnapshot(input));
        });

        doneButton.addEventListener("click", () => {
            closeFindUi();
        });
    }

    const input = document.getElementById(FIND_UI_INPUT_ID);
    const status = document.getElementById(FIND_UI_STATUS_ID);
    const previousButton = document.getElementById(FIND_UI_PREVIOUS_BUTTON_ID);
    const nextButton = document.getElementById(FIND_UI_NEXT_BUTTON_ID);
    const doneButton = document.getElementById(FIND_UI_DONE_BUTTON_ID);

    if (!(input instanceof HTMLInputElement)
        || !(status instanceof HTMLElement)
        || !(previousButton instanceof HTMLButtonElement)
        || !(nextButton instanceof HTMLButtonElement)
        || !(doneButton instanceof HTMLButtonElement)
        || !(container instanceof HTMLElement)) {
        return null;
    }

    return {
        container,
        input,
        status,
        previousButton,
        nextButton,
        doneButton
    };
}

function getNormalizedFindQuery(query) {
    return query.trim();
}

function isFindUiOpen() {
    const findUi = getFindUiElements(false);
    return Boolean(findUi && !findUi.container.hidden);
}

function openFindUi() {
    const findUi = getFindUiElements(true);
    if (!findUi) {
        return;
    }

    const wasOpen = !findUi.container.hidden;
    findUi.container.hidden = false;

    if (!wasOpen) {
        findUi.input.value = lastFindQuery;
    }

    findUi.input.focus({ preventScroll: true });
    findUi.input.select();

    const query = getNormalizedFindQuery(findUi.input.value);
    if (query) {
        runFindWithQueryFromUi(query, false, true, getInputSelectionSnapshot(findUi.input));
    } else {
        updateFindUiState("");
    }
}

function closeFindUi() {
    const findUi = getFindUiElements(false);
    if (!findUi) {
        return;
    }

    if (pendingFindUiSearchFrame !== null) {
        window.cancelAnimationFrame(pendingFindUiSearchFrame);
        pendingFindUiSearchFrame = null;
    }
    pendingFindUiSearchRequest = null;

    findUi.container.hidden = true;
    if (isTargetInsideFindUi(document.activeElement)) {
        findUi.input.blur();
    }
}

function scheduleFindFromUi(query, backwards, startFromBoundary, selectionSnapshot) {
    pendingFindUiSearchRequest = {
        query,
        backwards,
        startFromBoundary,
        selectionSnapshot
    };

    if (pendingFindUiSearchFrame !== null) {
        window.cancelAnimationFrame(pendingFindUiSearchFrame);
    }

    pendingFindUiSearchFrame = window.requestAnimationFrame(() => {
        pendingFindUiSearchFrame = null;

        const request = pendingFindUiSearchRequest;
        pendingFindUiSearchRequest = null;
        if (!request) {
            return;
        }

        runFindWithQueryFromUi(
            request.query,
            request.backwards,
            request.startFromBoundary,
            request.selectionSnapshot
        );
    });
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
    const titleElement = document.createElement("div");
    titleElement.className = "shelix-key-hint-title";
    titleElement.textContent = title;

    const rowsElement = document.createElement("div");
    rowsElement.className = "shelix-key-hint-rows";

    for (const row of rows) {
        const keyElement = document.createElement("span");
        keyElement.className = "shelix-key-hint-key";
        keyElement.textContent = row.key;

        const labelElement = document.createElement("span");
        labelElement.className = "shelix-key-hint-label";
        labelElement.textContent = row.label;

        rowsElement.append(keyElement, labelElement);
    }

    container.replaceChildren(titleElement, rowsElement);
    container.hidden = false;
    container.style.visibility = "hidden";
    container.style.width = "";

    const computedStyle = window.getComputedStyle(container);
    const horizontalInsets = parseFloat(computedStyle.paddingLeft)
        + parseFloat(computedStyle.paddingRight)
        + parseFloat(computedStyle.borderLeftWidth)
        + parseFloat(computedStyle.borderRightWidth);
    const contentWidth = Math.max(titleElement.scrollWidth, rowsElement.scrollWidth);
    const idealWidth = Math.ceil(contentWidth + horizontalInsets);
    const viewportLimit = Math.max(160, window.innerWidth - KEY_HINT_VIEWPORT_MARGIN_PX);
    const minWidth = Math.min(KEY_HINT_MIN_WIDTH_PX, viewportLimit);
    const maxWidth = Math.min(KEY_HINT_MAX_WIDTH_PX, viewportLimit);
    const boundedWidth = Math.min(maxWidth, Math.max(minWidth, idealWidth));

    container.style.width = `${boundedWidth}px`;
    container.style.visibility = "";
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

    if (isTargetInsideFindUi(target)) {
        return null;
    }

    const editable = target.closest(INPUT_FIELD_SELECTOR);
    if (!editable || isTargetInsideFindUi(editable)) {
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
    if (!(field instanceof HTMLElement) || isTargetInsideFindUi(field)) {
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

function getFindRangeContainerElement(range) {
    if (range.startContainer instanceof Element) {
        return range.startContainer;
    }

    return range.startContainer.parentElement;
}

function isElementVisibleForFind(element) {
    if (!(element instanceof Element) || !element.isConnected || isTargetInsideShelixUi(element)) {
        return false;
    }

    let current = element;
    while (current) {
        if (current instanceof HTMLElement && current.hidden) {
            return false;
        }

        const style = window.getComputedStyle(current);
        if (style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse") {
            return false;
        }

        current = current.parentElement;
    }

    const rects = element.getClientRects();
    for (const rect of rects) {
        if (rect.width > 0 && rect.height > 0) {
            return true;
        }
    }

    return false;
}

function canUseCustomFindHighlights() {
    return typeof CSS !== "undefined"
        && CSS.highlights
        && typeof CSS.highlights.set === "function"
        && typeof CSS.highlights.delete === "function"
        && typeof Highlight === "function";
}

function clearCustomFindHighlights() {
    if (!canUseCustomFindHighlights()) {
        return;
    }

    // Safari can defer repaint when deleting highlight entries during key handlers.
    // Replacing with empty highlights clears visuals immediately.
    CSS.highlights.set(FIND_HIGHLIGHT_MATCH_NAME, new Highlight());
    CSS.highlights.set(FIND_HIGHLIGHT_ACTIVE_NAME, new Highlight());
}

function clearFallbackFindHighlights() {
    const highlightedNodes = document.querySelectorAll(`.${FIND_FALLBACK_MATCH_CLASS}`);
    for (const highlightedNode of highlightedNodes) {
        const parent = highlightedNode.parentElement;
        highlightedNode.replaceWith(document.createTextNode(highlightedNode.textContent || ""));
        if (parent) {
            parent.normalize();
        }
    }
}

function clearFindResults() {
    clearCustomFindHighlights();
    clearFallbackFindHighlights();

    findMatches = [];
    activeFindMatchIndex = -1;
    activeFindQuery = "";
    didTruncateFindMatches = false;
    findUsesCustomHighlights = false;
}

function shouldIncludeTextNodeForFind(node) {
    if (!(node instanceof Text) || !node.nodeValue) {
        return false;
    }

    const parent = node.parentElement;
    if (!parent) {
        return false;
    }

    if (parent.closest(FIND_EXCLUDED_SEARCH_ANCESTOR_SELECTOR)) {
        return false;
    }

    return isElementVisibleForFind(parent);
}

function collectFindTextNodes() {
    const root = document.body || document.documentElement;
    if (!root) {
        return [];
    }

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
            return shouldIncludeTextNodeForFind(node)
                ? NodeFilter.FILTER_ACCEPT
                : NodeFilter.FILTER_SKIP;
        }
    });

    const textNodes = [];
    let currentNode = walker.nextNode();
    while (currentNode) {
        if (currentNode instanceof Text) {
            textNodes.push(currentNode);
        }

        currentNode = walker.nextNode();
    }

    return textNodes;
}

function collectFindMatchEntries(query) {
    const entries = [];
    let didTruncate = false;
    const needle = query.toLocaleLowerCase();
    const step = Math.max(1, query.length);

    for (const textNode of collectFindTextNodes()) {
        const textContent = textNode.nodeValue || "";
        const haystack = textContent.toLocaleLowerCase();
        let offset = 0;

        while (offset <= haystack.length - query.length) {
            const index = haystack.indexOf(needle, offset);
            if (index === -1) {
                break;
            }

            entries.push({
                node: textNode,
                start: index,
                end: index + query.length
            });

            if (entries.length >= FIND_MATCH_LIMIT) {
                didTruncate = true;
                break;
            }

            offset = index + step;
        }

        if (didTruncate) {
            break;
        }
    }

    return {
        entries,
        didTruncate
    };
}

function buildFindMatchesWithCustomHighlights(entries) {
    findMatches = entries.map((entry) => {
        const range = document.createRange();
        range.setStart(entry.node, entry.start);
        range.setEnd(entry.node, entry.end);

        return {
            range,
            element: null
        };
    });

    findUsesCustomHighlights = true;
}

function buildFindMatchesWithFallbackSpans(entries) {
    const entriesByNode = new Map();
    for (const entry of entries) {
        const nodeEntries = entriesByNode.get(entry.node) || [];
        nodeEntries.push(entry);
        entriesByNode.set(entry.node, nodeEntries);
    }

    const createdMatches = [];
    for (const [textNode, nodeEntries] of entriesByNode.entries()) {
        const textContent = textNode.nodeValue || "";
        let cursor = 0;
        const fragment = document.createDocumentFragment();

        for (const entry of nodeEntries) {
            if (entry.start > cursor) {
                fragment.append(document.createTextNode(textContent.slice(cursor, entry.start)));
            }

            const highlightedSegment = document.createElement("span");
            highlightedSegment.className = FIND_FALLBACK_MATCH_CLASS;
            highlightedSegment.textContent = textContent.slice(entry.start, entry.end);
            fragment.append(highlightedSegment);

            createdMatches.push({
                range: null,
                element: highlightedSegment
            });
            cursor = entry.end;
        }

        if (cursor < textContent.length) {
            fragment.append(document.createTextNode(textContent.slice(cursor)));
        }

        textNode.replaceWith(fragment);
    }

    findMatches = createdMatches;
    findUsesCustomHighlights = false;
}

function rebuildFindResults(query) {
    clearCustomFindHighlights();
    clearFallbackFindHighlights();

    findMatches = [];
    activeFindMatchIndex = -1;
    activeFindQuery = query;
    didTruncateFindMatches = false;
    findUsesCustomHighlights = false;

    const { entries, didTruncate } = collectFindMatchEntries(query);
    didTruncateFindMatches = didTruncate;
    if (entries.length === 0) {
        return;
    }

    if (canUseCustomFindHighlights()) {
        buildFindMatchesWithCustomHighlights(entries);
        return;
    }

    buildFindMatchesWithFallbackSpans(entries);
}

function getActiveFindMatch() {
    if (activeFindMatchIndex < 0 || activeFindMatchIndex >= findMatches.length) {
        return null;
    }

    return findMatches[activeFindMatchIndex] || null;
}

function updateRenderedFindHighlights() {
    if (findMatches.length === 0) {
        clearCustomFindHighlights();
        return false;
    }

    if (findUsesCustomHighlights && canUseCustomFindHighlights()) {
        const allMatchesHighlight = new Highlight();
        for (const match of findMatches) {
            if (match.range instanceof Range) {
                allMatchesHighlight.add(match.range);
            }
        }

        CSS.highlights.set(FIND_HIGHLIGHT_MATCH_NAME, allMatchesHighlight);

        const activeMatchHighlight = new Highlight();
        const activeMatch = getActiveFindMatch();
        if (activeMatch && activeMatch.range instanceof Range) {
            activeMatchHighlight.add(activeMatch.range);
        }

        CSS.highlights.set(FIND_HIGHLIGHT_ACTIVE_NAME, activeMatchHighlight);
        return true;
    }

    for (let index = 0; index < findMatches.length; index += 1) {
        const match = findMatches[index];
        if (!(match.element instanceof Element)) {
            continue;
        }

        match.element.classList.toggle(FIND_FALLBACK_ACTIVE_CLASS, index === activeFindMatchIndex);
    }

    return true;
}

function scrollActiveFindMatchIntoView() {
    const activeMatch = getActiveFindMatch();
    if (!activeMatch) {
        return;
    }

    if (activeMatch.element instanceof Element) {
        activeMatch.element.scrollIntoView({
            block: "center",
            inline: "nearest"
        });
        return;
    }

    if (!(activeMatch.range instanceof Range)) {
        return;
    }

    const container = getFindRangeContainerElement(activeMatch.range);
    if (!container) {
        return;
    }

    container.scrollIntoView({
        block: "center",
        inline: "nearest"
    });
}

function getFindStatusLabel(matchCount) {
    if (matchCount <= 0 || activeFindMatchIndex < 0) {
        return "";
    }

    const activeMatchNumber = Math.min(matchCount, activeFindMatchIndex + 1);
    return didTruncateFindMatches
        ? `${activeMatchNumber} of ${matchCount}+`
        : `${activeMatchNumber} of ${matchCount}`;
}

function updateFindUiState(query) {
    const findUi = getFindUiElements(false);
    if (!findUi) {
        return;
    }

    if (!query) {
        findUi.status.textContent = "";
        findUi.status.dataset.state = "idle";
        findUi.previousButton.disabled = true;
        findUi.nextButton.disabled = true;
        return;
    }

    const matchCount = findMatches.length;
    if (matchCount === 0) {
        findUi.status.textContent = "No matches";
        findUi.status.dataset.state = "error";
        findUi.previousButton.disabled = true;
        findUi.nextButton.disabled = true;
        return;
    }

    findUi.status.textContent = getFindStatusLabel(matchCount);
    findUi.status.dataset.state = "ok";
    findUi.previousButton.disabled = false;
    findUi.nextButton.disabled = false;
}

function setActiveFindMatchIndex(index) {
    if (findMatches.length === 0) {
        activeFindMatchIndex = -1;
        return false;
    }

    const boundedIndex = ((index % findMatches.length) + findMatches.length) % findMatches.length;
    activeFindMatchIndex = boundedIndex;
    updateRenderedFindHighlights();
    scrollActiveFindMatchIntoView();
    return true;
}

function runFindWithQuery(query, backwards, startFromBoundary) {
    const normalizedQuery = getNormalizedFindQuery(query);
    if (!normalizedQuery) {
        lastFindQuery = "";
        clearFindResults();
        updateFindUiState("");
        return false;
    }

    lastFindQuery = normalizedQuery;

    if (activeFindQuery !== normalizedQuery || findMatches.length === 0) {
        rebuildFindResults(normalizedQuery);
        if (findMatches.length === 0) {
            updateFindUiState(normalizedQuery);
            return false;
        }

        const boundaryIndex = backwards ? findMatches.length - 1 : 0;
        setActiveFindMatchIndex(boundaryIndex);
        updateFindUiState(normalizedQuery);
        return true;
    }

    if (startFromBoundary || activeFindMatchIndex === -1) {
        const boundaryIndex = backwards ? findMatches.length - 1 : 0;
        setActiveFindMatchIndex(boundaryIndex);
    } else {
        const direction = backwards ? -1 : 1;
        setActiveFindMatchIndex(activeFindMatchIndex + direction);
    }

    updateFindUiState(normalizedQuery);
    return true;
}

function restoreFindUiInputFocus(selectionSnapshot) {
    const findUi = getFindUiElements(false);
    if (!findUi || findUi.container.hidden) {
        return;
    }

    if (document.activeElement !== findUi.input) {
        findUi.input.focus({ preventScroll: true });
    }

    if (!selectionSnapshot) {
        return;
    }

    const hasStart = Number.isInteger(selectionSnapshot.start);
    const hasEnd = Number.isInteger(selectionSnapshot.end);
    if (!hasStart || !hasEnd) {
        return;
    }

    const inputLength = findUi.input.value.length;
    const start = Math.min(selectionSnapshot.start, inputLength);
    const end = Math.min(selectionSnapshot.end, inputLength);

    try {
        findUi.input.setSelectionRange(start, end, selectionSnapshot.direction || "none");
    } catch {
        // Some input implementations may reject selection restoration.
    }
}

function runFindWithQueryFromUi(query, backwards, startFromBoundary, selectionSnapshot) {
    const didFind = runFindWithQuery(query, backwards, startFromBoundary);
    restoreFindUiInputFocus(selectionSnapshot);
    return didFind;
}

function getQueryForFindNavigation() {
    const findUi = getFindUiElements(false);
    if (findUi && !findUi.container.hidden) {
        const queryFromInput = getNormalizedFindQuery(findUi.input.value);
        if (queryFromInput) {
            return queryFromInput;
        }
    }

    return lastFindQuery;
}

function runFindNavigation(backwards) {
    const query = getQueryForFindNavigation();
    if (!query) {
        updateFindUiState("");
        return false;
    }

    return runFindWithQuery(query, backwards, false);
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
        openFindUi();
        return;
    }

    if (action === ACTION.FIND_NEXT) {
        runFindNavigation(false);
        return;
    }

    if (action === ACTION.FIND_PREVIOUS) {
        runFindNavigation(true);
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

    if (isTargetInsideFindUi(event.target)) {
        return;
    }

    if (mode === "insert" && !isEditableTarget(document.activeElement)) {
        setMode("normal");
    }

    const key = normalizeKey(event);

    if (key === "escape" && isFindUiOpen()) {
        event.preventDefault();
        closeFindUi();
        return;
    }

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
        clearFindResults();
        updateFindUiState("");
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

    if (isTargetInsideFindUi(event.target)) {
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
