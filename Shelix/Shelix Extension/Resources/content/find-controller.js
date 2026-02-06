function ensureFindUiStyle() {
    if (document.getElementById(FIND_UI_STYLE_ID)) {
        return;
    }

    const styleElement = document.createElement("style");
    styleElement.id = FIND_UI_STYLE_ID;
    styleElement.textContent = `
        #${FIND_UI_CONTAINER_ID} {
            position: fixed;
            inset: unset;
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
            margin: 0;
        }

        @supports (backdrop-filter: blur(12px)) or (-webkit-backdrop-filter: blur(12px)) {
            #${FIND_UI_CONTAINER_ID} {
                background: color-mix(in srgb, Canvas 78%, transparent);
                -webkit-backdrop-filter: saturate(180%) blur(12px);
                backdrop-filter: saturate(180%) blur(12px);
            }
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

        @scope (#${FIND_UI_CONTAINER_ID}) {
            :scope {
                position: fixed;
                inset: unset;
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
                margin: 0;
            }

            @supports (backdrop-filter: blur(12px)) or (-webkit-backdrop-filter: blur(12px)) {
                :scope {
                    background: color-mix(in srgb, Canvas 78%, transparent);
                    -webkit-backdrop-filter: saturate(180%) blur(12px);
                    backdrop-filter: saturate(180%) blur(12px);
                }
            }

            :scope[hidden] {
                display: none !important;
            }

            * {
                box-sizing: border-box;
                font: inherit;
            }

            #${FIND_UI_INPUT_ID} {
                min-width: 18em;
                max-width: min(40em, 50vw);
                padding: 4px 6px;
                border: 1px solid GrayText;
                border-radius: 6px;
                background: Field;
                color: FieldText;
                font: inherit;
            }

            #${FIND_UI_INPUT_ID}::placeholder {
                color: GrayText;
                opacity: 1;
            }

            #${FIND_UI_STATUS_ID} {
                min-width: 9ch;
                text-align: right;
                white-space: nowrap;
                color: GrayText;
            }

            #${FIND_UI_STATUS_ID}[data-state="error"] {
                color: LinkText;
            }

            button {
                min-width: 2.2em;
                padding: 3px 7px;
                border: 1px solid GrayText;
                border-radius: 6px;
                background: ButtonFace;
                color: ButtonText;
                line-height: 1.1;
            }

            button:disabled {
                opacity: 0.5;
            }
        }

        ::highlight(${FIND_HIGHLIGHT_MATCH_NAME}) {
            background: Mark;
            color: MarkText;
        }

        ::highlight(${FIND_HIGHLIGHT_ACTIVE_NAME}) {
            background: Highlight;
            color: HighlightText;
        }

    `;

    (document.head || document.documentElement).appendChild(styleElement);
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
        container.setAttribute("popover", "manual");
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
        doneButton.setAttribute("aria-label", "Close find bar");

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
    shelixShowPopover(findUi.container);

    if (!wasOpen) {
        findUi.input.value = state.lastFindQuery;
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

    cancelPendingFindSchedule();

    if (isTargetInsideFindUi(document.activeElement)) {
        findUi.input.blur();
    }

    shelixHidePopover(findUi.container);
}

function cancelPendingFindSchedule() {
    if (state.pendingFindUiDebounceTimer !== null) {
        clearTimeout(state.pendingFindUiDebounceTimer);
        state.pendingFindUiDebounceTimer = null;
    }

    if (state.pendingFindUiSearchFrame !== null) {
        window.cancelAnimationFrame(state.pendingFindUiSearchFrame);
        state.pendingFindUiSearchFrame = null;
    }

    state.pendingFindUiSearchRequest = null;
}

function flushPendingFindRequest() {
    state.pendingFindUiSearchFrame = null;

    const request = state.pendingFindUiSearchRequest;
    state.pendingFindUiSearchRequest = null;
    if (!request) {
        return;
    }

    runFindWithQueryFromUi(
        request.query,
        request.backwards,
        request.startFromBoundary,
        request.selectionSnapshot
    );
}

function scheduleFindFromUi(query, backwards, startFromBoundary, selectionSnapshot) {
    cancelPendingFindSchedule();

    const normalizedQuery = getNormalizedFindQuery(query);
    if (normalizedQuery !== state.activeFindQuery) {
        clearFindResults();
        updateFindUiState(normalizedQuery);
    }

    state.pendingFindUiSearchRequest = {
        query,
        backwards,
        startFromBoundary,
        selectionSnapshot
    };

    state.pendingFindUiDebounceTimer = setTimeout(() => {
        state.pendingFindUiDebounceTimer = null;
        state.pendingFindUiSearchFrame = window.requestAnimationFrame(flushPendingFindRequest);
    }, FIND_DEBOUNCE_MS);
}

function canUseCustomFindHighlights() {
    return typeof CSS !== "undefined"
        && CSS.highlights
        && typeof CSS.highlights.set === "function"
        && typeof CSS.highlights.delete === "function"
        && typeof Highlight === "function";
}

function ensureFindHighlightObjects() {
    if (state.findMatchHighlight && state.findActiveHighlight) {
        return;
    }

    if (!canUseCustomFindHighlights()) {
        return;
    }

    state.findMatchHighlight = new Highlight();
    state.findActiveHighlight = new Highlight();
    CSS.highlights.set(FIND_HIGHLIGHT_MATCH_NAME, state.findMatchHighlight);
    CSS.highlights.set(FIND_HIGHLIGHT_ACTIVE_NAME, state.findActiveHighlight);
}

function clearCustomFindHighlights() {
    if (state.findMatchHighlight) {
        state.findMatchHighlight.clear();
    }

    if (state.findActiveHighlight) {
        state.findActiveHighlight.clear();
    }
}

function clearFindResults() {
    clearCustomFindHighlights();

    state.findMatches = [];
    state.activeFindMatchIndex = -1;
    state.activeFindQuery = "";
    state.didTruncateFindMatches = false;
    state.findUsesCustomHighlights = false;
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
    ensureFindHighlightObjects();
    state.findMatchHighlight.clear();

    state.findMatches = entries.map((entry) => {
        const range = document.createRange();
        range.setStart(entry.node, entry.start);
        range.setEnd(entry.node, entry.end);
        state.findMatchHighlight.add(range);

        return {
            range,
            element: null
        };
    });

    state.findUsesCustomHighlights = true;
}

function buildFindMatchesWithoutHighlights(entries) {
    state.findMatches = entries.map((entry) => {
        const range = document.createRange();
        range.setStart(entry.node, entry.start);
        range.setEnd(entry.node, entry.end);

        return {
            range,
            element: null
        };
    });

    state.findUsesCustomHighlights = false;
}

function rebuildFindResults(query) {
    clearCustomFindHighlights();

    state.findMatches = [];
    state.activeFindMatchIndex = -1;
    state.activeFindQuery = query;
    state.didTruncateFindMatches = false;
    state.findUsesCustomHighlights = false;

    const { entries, didTruncate } = collectFindMatchEntries(query);
    state.didTruncateFindMatches = didTruncate;
    if (entries.length === 0) {
        return;
    }

    if (canUseCustomFindHighlights()) {
        buildFindMatchesWithCustomHighlights(entries);
        return;
    }

    buildFindMatchesWithoutHighlights(entries);
}

function isFindMatchValid(match) {
    if (!match) {
        return false;
    }

    if (match.range instanceof Range) {
        return match.range.startContainer.isConnected;
    }

    if (match.element instanceof Element) {
        return match.element.isConnected;
    }

    return false;
}

function getActiveFindMatch() {
    if (state.activeFindMatchIndex < 0 || state.activeFindMatchIndex >= state.findMatches.length) {
        return null;
    }

    const match = state.findMatches[state.activeFindMatchIndex] || null;
    if (match && !isFindMatchValid(match)) {
        return null;
    }

    return match;
}

function updateRenderedFindHighlights() {
    if (state.findMatches.length === 0) {
        clearCustomFindHighlights();
        return false;
    }

    if (state.findUsesCustomHighlights && state.findActiveHighlight) {
        state.findActiveHighlight.clear();

        const activeMatch = getActiveFindMatch();
        if (activeMatch && activeMatch.range instanceof Range) {
            state.findActiveHighlight.add(activeMatch.range);
        }

        return true;
    }

    return true;
}

function scrollActiveFindMatchIntoView() {
    const activeMatch = getActiveFindMatch();
    if (!activeMatch) {
        return;
    }

    if (activeMatch.element instanceof Element && activeMatch.element.isConnected) {
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
    if (!container || !container.isConnected) {
        return;
    }

    container.scrollIntoView({
        block: "center",
        inline: "nearest"
    });
}

function getFindStatusLabel(matchCount) {
    if (matchCount <= 0 || state.activeFindMatchIndex < 0) {
        return "";
    }

    const activeMatchNumber = Math.min(matchCount, state.activeFindMatchIndex + 1);
    return state.didTruncateFindMatches
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

    const matchCount = state.findMatches.length;
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
    if (state.findMatches.length === 0) {
        state.activeFindMatchIndex = -1;
        return false;
    }

    const boundedIndex = ((index % state.findMatches.length) + state.findMatches.length) % state.findMatches.length;
    state.activeFindMatchIndex = boundedIndex;
    updateRenderedFindHighlights();
    scrollActiveFindMatchIntoView();
    return true;
}

function runFindWithQuery(query, backwards, startFromBoundary) {
    const normalizedQuery = getNormalizedFindQuery(query);
    if (!normalizedQuery) {
        state.lastFindQuery = "";
        clearFindResults();
        updateFindUiState("");
        return false;
    }

    state.lastFindQuery = normalizedQuery;

    if (state.activeFindQuery !== normalizedQuery || state.findMatches.length === 0) {
        rebuildFindResults(normalizedQuery);
        if (state.findMatches.length === 0) {
            updateFindUiState(normalizedQuery);
            return false;
        }

        const boundaryIndex = backwards ? state.findMatches.length - 1 : 0;
        setActiveFindMatchIndex(boundaryIndex);
        updateFindUiState(normalizedQuery);
        return true;
    }

    if (startFromBoundary || state.activeFindMatchIndex === -1) {
        const boundaryIndex = backwards ? state.findMatches.length - 1 : 0;
        setActiveFindMatchIndex(boundaryIndex);
    } else {
        const direction = backwards ? -1 : 1;
        setActiveFindMatchIndex(state.activeFindMatchIndex + direction);
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

    return state.lastFindQuery;
}

function runFindNavigation(backwards) {
    const query = getQueryForFindNavigation();
    if (!query) {
        updateFindUiState("");
        return false;
    }

    return runFindWithQuery(query, backwards, false);
}
