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

    state.keyHintMode = "hidden";
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
    state.keyHintMode = "prefix";
}

function showHelpKeyHint() {
    showKeyHintPopup("Keymap", HELP_KEY_HINT_ROWS);
    state.keyHintMode = "help";
}
