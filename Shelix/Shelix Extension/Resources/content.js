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

let scrollAnimationFrame = null;
let lastScrollFrameTime = 0;
let isJPressed = false;
let isKPressed = false;

function isEditableTarget(target) {
    if (!(target instanceof Element)) {
        return false;
    }

    const editable = target.closest(INPUT_FIELD_SELECTOR);
    if (!editable) {
        return false;
    }

    if (editable instanceof HTMLInputElement || editable instanceof HTMLTextAreaElement) {
        return !editable.disabled && !editable.readOnly;
    }

    return true;
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

function focusRelativeField(direction) {
    const fields = getNavigableFields();
    if (fields.length === 0) {
        return;
    }

    const activeElement = document.activeElement;
    const currentIndex = fields.indexOf(activeElement);
    const nextIndex = currentIndex === -1
        ? (direction > 0 ? 0 : fields.length - 1)
        : (currentIndex + direction + fields.length) % fields.length;

    const nextField = fields[nextIndex];
    nextField.focus();
    nextField.scrollIntoView({
        block: "center",
        inline: "nearest"
    });
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

document.addEventListener("keydown", (event) => {
    if (event.defaultPrevented || event.isComposing) {
        return;
    }

    if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
    }

    if (isEditableTarget(event.target)) {
        return;
    }

    const key = event.key.toLowerCase();
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
        focusRelativeField(-1);
        return;
    }

    if (key === "l") {
        event.preventDefault();
        focusRelativeField(1);
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
