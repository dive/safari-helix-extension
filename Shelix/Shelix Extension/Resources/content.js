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
const TAB_ACTION_MESSAGE_TYPE = "shelix.tabAction";
const TAB_ACTION = Object.freeze({
    NEXT: "next",
    PREVIOUS: "previous",
    NEW: "new",
    CLOSE: "close",
    DUPLICATE: "duplicate"
});
const PREFIX_SEQUENCE_TIMEOUT_MS = 1000;

let scrollAnimationFrame = null;
let lastScrollFrameTime = 0;
let isJPressed = false;
let isKPressed = false;
let highlightedField = null;
let mode = "normal";
let hasPendingGSequence = false;
let pendingGTimeout = null;
let hasPendingSpaceSequence = false;
let pendingSpaceTimeout = null;

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
        clearPendingGSequence();
        clearPendingSpaceSequence();
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

function clearPendingGSequence() {
    hasPendingGSequence = false;
    if (pendingGTimeout !== null) {
        window.clearTimeout(pendingGTimeout);
        pendingGTimeout = null;
    }
}

function armPendingGSequence() {
    clearPendingGSequence();
    hasPendingGSequence = true;
    pendingGTimeout = window.setTimeout(() => {
        clearPendingGSequence();
    }, PREFIX_SEQUENCE_TIMEOUT_MS);
}

function requestTabAction(action) {
    browser.runtime.sendMessage({
        type: TAB_ACTION_MESSAGE_TYPE,
        action
    }).catch(() => {
        // Background script may be unavailable briefly during extension reloads.
    });
}

function handleGSequence(event, key) {
    if (!hasPendingGSequence) {
        return false;
    }

    if (key === "shift") {
        return false;
    }

    if (key === "g") {
        event.preventDefault();
        armPendingGSequence();
        return true;
    }

    clearPendingGSequence();

    let action = null;
    if (key === "n") {
        action = TAB_ACTION.NEXT;
    } else if (key === "p") {
        action = TAB_ACTION.PREVIOUS;
    }

    if (!action) {
        return false;
    }

    event.preventDefault();
    requestTabAction(action);
    return true;
}

function clearPendingSpaceSequence() {
    hasPendingSpaceSequence = false;
    if (pendingSpaceTimeout !== null) {
        window.clearTimeout(pendingSpaceTimeout);
        pendingSpaceTimeout = null;
    }
}

function armPendingSpaceSequence() {
    clearPendingSpaceSequence();
    hasPendingSpaceSequence = true;
    pendingSpaceTimeout = window.setTimeout(() => {
        clearPendingSpaceSequence();
    }, PREFIX_SEQUENCE_TIMEOUT_MS);
}

function handleSpaceSequence(event, key) {
    if (!hasPendingSpaceSequence) {
        return false;
    }

    if (key === " ") {
        event.preventDefault();
        armPendingSpaceSequence();
        return true;
    }

    clearPendingSpaceSequence();

    let action = null;
    if (key === "n") {
        action = TAB_ACTION.NEW;
    } else if (key === "q") {
        action = TAB_ACTION.CLOSE;
    } else if (key === "d") {
        action = TAB_ACTION.DUPLICATE;
    }

    if (!action) {
        return false;
    }

    event.preventDefault();
    requestTabAction(action);
    return true;
}

document.addEventListener("keydown", (event) => {
    if (event.defaultPrevented || event.isComposing) {
        return;
    }

    if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
    }

    if (mode === "insert" && !isEditableTarget(document.activeElement)) {
        setMode("normal");
    }

    const key = event.key.toLowerCase();
    if (handleGSequence(event, key)) {
        return;
    }
    if (handleSpaceSequence(event, key)) {
        return;
    }

    if (key === "escape" && mode === "insert") {
        event.preventDefault();
        exitInsertMode();
        return;
    }

    if (key === "escape" && mode === "normal") {
        event.preventDefault();
        setHighlightedField(null);
        return;
    }

    if (key === "i" && mode === "normal") {
        const fields = getNavigableFields();
        const field = getHighlightedField(fields) || fields[0] || null;
        if (!field) {
            return;
        }

        event.preventDefault();
        enterInsertMode(field);
        return;
    }

    if (key === "enter" && mode === "normal") {
        const field = ensureHighlightedField();
        if (!field) {
            return;
        }

        event.preventDefault();
        enterInsertMode(field);
        return;
    }

    if (isEditableTarget(event.target)) {
        return;
    }

    if (key === "g" && mode === "normal") {
        event.preventDefault();
        armPendingGSequence();
        return;
    }

    if (key === " " && mode === "normal") {
        event.preventDefault();
        armPendingSpaceSequence();
        return;
    }

    if (key === "j") {
        event.preventDefault();
        isJPressed = true;
        ensureScrollingLoop();
        return;
    }

    if (key === "k") {
        event.preventDefault();
        isKPressed = true;
        ensureScrollingLoop();
        return;
    }

    if (key === "h") {
        event.preventDefault();
        highlightRelativeField(-1);
        return;
    }

    if (key === "l") {
        event.preventDefault();
        highlightRelativeField(1);
    }
}, {
    capture: true
});

document.addEventListener("keyup", (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
    }

    const key = event.key.toLowerCase();
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

window.addEventListener("blur", clearScrollKeys);
document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") {
        clearScrollKeys();
    }
});
window.addEventListener("blur", clearPendingGSequence);
window.addEventListener("blur", clearPendingSpaceSequence);
document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") {
        clearPendingGSequence();
        clearPendingSpaceSequence();
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
