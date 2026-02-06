const shelixShared = globalThis.ShelixShared;
if (!shelixShared) {
    throw new Error("Shelix shared constants must load before content modules.");
}

const {
    TAB_ACTION_MESSAGE_TYPE,
    TAB_ACTION,
    ACTION,
    NORMAL_MODE_ACTIONS,
    PREFIX_ACTIONS,
    PREFIX_TITLES,
    ACTION_LABELS,
    HELP_KEY_HINT_ROWS
} = shelixShared;

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
    "[contenteditable]:not([contenteditable='false'])"
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
const FIND_MATCH_LIMIT = 2000;
const FIND_DEBOUNCE_MS = 80;
const FIND_EXCLUDED_SEARCH_ANCESTOR_SELECTOR = "script, style, noscript, textarea, option";
const LINK_HINT_STYLE_ID = "shelix-link-hint-style";
const LINK_HINT_OVERLAY_ID = "shelix-link-hints";
const LINK_HINT_LABEL_CLASS = "shelix-link-hint-label";

function canUsePopover(el) {
    return typeof el?.showPopover === "function" && typeof el?.hidePopover === "function";
}

function shelixShowPopover(el) {
    el.hidden = false;
    if (canUsePopover(el)) {
        try { el.showPopover(); } catch {}
    }
}

function shelixHidePopover(el) {
    if (canUsePopover(el)) {
        try { el.hidePopover(); } catch {}
    }
    el.hidden = true;
}
