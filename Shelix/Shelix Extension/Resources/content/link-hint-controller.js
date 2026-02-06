function ensureLinkHintStyle() {
    if (document.getElementById(LINK_HINT_STYLE_ID)) {
        return;
    }

    const styleElement = document.createElement("style");
    styleElement.id = LINK_HINT_STYLE_ID;
    styleElement.textContent = `
        #${LINK_HINT_OVERLAY_ID} {
            position: fixed;
            inset: 0;
            z-index: 2147483647;
            pointer-events: none;
            color-scheme: light dark;
        }

        #${LINK_HINT_OVERLAY_ID}[hidden] {
            display: none !important;
        }

        .${LINK_HINT_LABEL_CLASS} {
            position: absolute;
            padding: 1px 4px;
            border: 1px solid GrayText;
            border-radius: 3px;
            background: Canvas;
            color: GrayText;
            font: menu;
            font-weight: 600;
            line-height: 1.2;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            white-space: nowrap;
            pointer-events: none;
        }

        .${LINK_HINT_LABEL_CLASS} .shelix-hint-active-char {
            color: CanvasText;
        }

        .${LINK_HINT_LABEL_CLASS}[data-state="partial"] {
            border-color: #ff7a00;
        }

        .${LINK_HINT_LABEL_CLASS}[data-state="partial"] .shelix-hint-active-char {
            color: #ff7a00;
        }

        @scope (#${LINK_HINT_OVERLAY_ID}) {
            :scope {
                position: fixed;
                inset: 0;
                z-index: 2147483647;
                pointer-events: none;
                color-scheme: light dark;
            }

            :scope[hidden] {
                display: none !important;
            }

            .${LINK_HINT_LABEL_CLASS} {
                position: absolute;
                padding: 1px 4px;
                border: 1px solid GrayText;
                border-radius: 3px;
                background: Canvas;
                color: GrayText;
                font: menu;
                font-weight: 600;
                line-height: 1.2;
                letter-spacing: 0.5px;
                text-transform: uppercase;
                white-space: nowrap;
                pointer-events: none;
            }

            .${LINK_HINT_LABEL_CLASS} .shelix-hint-active-char {
                color: CanvasText;
            }

            .${LINK_HINT_LABEL_CLASS}[data-state="partial"] {
                border-color: #ff7a00;
            }

            .${LINK_HINT_LABEL_CLASS}[data-state="partial"] .shelix-hint-active-char {
                color: #ff7a00;
            }
        }
    `;

    (document.head || document.documentElement).appendChild(styleElement);
}

var LINK_HINT_CHARS = ["a", "s", "d", "f", "g", "h", "j", "k", "l"];

var LINK_HINT_CLICKABLE_SELECTOR = [
    "a[href]",
    "button",
    "[role='button']",
    "[role='link']",
    "[role='tab']",
    "[role='menuitem']",
    "input[type='submit']",
    "input[type='button']",
    "input[type='reset']",
    "summary",
    "[onclick]",
    "[tabindex]"
].join(",");

function generateHintLabels(count) {
    const chars = LINK_HINT_CHARS;
    if (count <= chars.length) {
        return chars.slice(0, count);
    }

    const labels = [];
    for (let i = 0; i < chars.length && labels.length < count; i++) {
        for (let j = 0; j < chars.length && labels.length < count; j++) {
            labels.push(chars[i] + chars[j]);
        }
    }
    return labels;
}

function getHintableElements() {
    const elements = Array.from(document.querySelectorAll(LINK_HINT_CLICKABLE_SELECTOR));
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    return elements.filter((el) => {
        if (!el.isConnected) {
            return false;
        }

        if (isTargetInsideShelixUi(el)) {
            return false;
        }

        if (el.disabled) {
            return false;
        }

        if (el.getAttribute("aria-hidden") === "true") {
            return false;
        }

        const style = window.getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse") {
            return false;
        }

        const rect = el.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) {
            return false;
        }

        if (rect.top >= viewportHeight || rect.bottom <= 0 || rect.left >= viewportWidth || rect.right <= 0) {
            return false;
        }

        return true;
    });
}

function renderLabelContent(labelElement, label, matchedCount) {
    labelElement.textContent = "";
    if (matchedCount > 0) {
        const matched = document.createElement("span");
        matched.textContent = label.slice(0, matchedCount);
        labelElement.appendChild(matched);
    }
    const activeChar = document.createElement("span");
    activeChar.className = "shelix-hint-active-char";
    activeChar.textContent = label.charAt(matchedCount);
    labelElement.appendChild(activeChar);
    const rest = label.slice(matchedCount + 1);
    if (rest) {
        labelElement.appendChild(document.createTextNode(rest));
    }
}

function showLinkHints() {
    hideLinkHints();

    const elements = getHintableElements();
    if (elements.length === 0) {
        return;
    }

    ensureLinkHintStyle();

    const labels = generateHintLabels(elements.length);

    const overlay = document.createElement("div");
    overlay.id = LINK_HINT_OVERLAY_ID;

    const hints = [];
    for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        const label = labels[i];
        const rect = element.getBoundingClientRect();

        const labelElement = document.createElement("span");
        labelElement.className = LINK_HINT_LABEL_CLASS;
        labelElement.style.left = rect.left + "px";
        labelElement.style.top = rect.top + "px";
        renderLabelContent(labelElement, label, 0);

        overlay.appendChild(labelElement);
        hints.push({ element, label, labelElement });
    }

    document.documentElement.appendChild(overlay);

    state.linkHints = hints;
    state.linkHintMode = "active";
    state.linkHintInput = "";
}

function handleLinkHintInput(char) {
    state.linkHintInput += char;
    const input = state.linkHintInput;

    const matching = state.linkHints.filter((hint) => hint.label.startsWith(input));

    if (matching.length === 0) {
        hideLinkHints();
        return;
    }

    if (matching.length === 1 && matching[0].label === input) {
        activateLinkHint(matching[0]);
        return;
    }

    for (const hint of state.linkHints) {
        if (hint.label.startsWith(input)) {
            hint.labelElement.dataset.state = "partial";
            renderLabelContent(hint.labelElement, hint.label, input.length);
        } else {
            hint.labelElement.hidden = true;
        }
    }
}

function activateLinkHint(hint) {
    hideLinkHints();
    hint.element.focus();
    hint.element.click();
}

function hideLinkHints() {
    const overlay = document.getElementById(LINK_HINT_OVERLAY_ID);
    if (overlay) {
        overlay.remove();
    }

    state.linkHints = [];
    state.linkHintMode = "hidden";
    state.linkHintInput = "";
}

function isLinkHintModeActive() {
    return state.linkHintMode === "active";
}
