const state = {
    scrollAnimationFrame: null,
    lastScrollFrameTime: 0,
    isJPressed: false,
    isKPressed: false,
    highlightedField: null,
    mode: "normal",
    pendingPrefixKey: null,
    lastFindQuery: "",
    activeFindQuery: "",
    activeFindMatchIndex: -1,
    findMatches: [],
    didTruncateFindMatches: false,
    findUsesCustomHighlights: false,
    keyHintMode: "hidden",
    pendingFindUiSearchFrame: null,
    pendingFindUiSearchRequest: null
};
