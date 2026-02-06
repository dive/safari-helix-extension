var state = globalThis.__shelixState;
if (!state) {
    state = {
        extensionEnabled: true,
        toggleShortcut: { ...DEFAULT_TOGGLE_SHORTCUT },
        scrollAnimationFrame: null,
        lastScrollFrameTime: 0,
        isJPressed: false,
        isKPressed: false,
        scrollBoundaryFrames: 0,
        highlightedField: null,
        mode: "normal",
        pendingPrefixKey: null,
        lastFindQuery: "",
        activeFindQuery: "",
        activeFindMatchIndex: -1,
        findMatches: [],
        didTruncateFindMatches: false,
        findUsesCustomHighlights: false,
        findMatchHighlight: null,
        findActiveHighlight: null,
        keyHintMode: "hidden",
        linkHints: [],
        linkHintMode: "hidden",
        linkHintInput: "",
        pendingFindUiSearchFrame: null,
        pendingFindUiSearchRequest: null,
        pendingFindUiDebounceTimer: null,
        discreteScrollPending: false,
        discreteScrollQueue: 0
    };
    globalThis.__shelixState = state;
}
