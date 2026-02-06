var shelixShared = globalThis.ShelixShared;
if (!shelixShared) {
    throw new Error("Shelix shared constants must load before content modules.");
}

var {
    TAB_ACTION_MESSAGE_TYPE,
    SETTINGS_MESSAGE_TYPE,
    DEFAULT_TOGGLE_SHORTCUT,
    TAB_ACTION,
    ACTION,
    NORMAL_MODE_ACTIONS,
    PREFIX_ACTIONS,
    PREFIX_TITLES,
    ACTION_LABELS,
    HELP_KEY_HINT_ROWS
} = shelixShared;

var INPUT_FIELD_SELECTOR = [
    "input:not([type])",
    "input[type='text']",
    "input[type='search']",
    "input[type='email']",
    "input[type='password']",
    "input[type='url']",
    "input[type='tel']",
    "input[type='number']",
    "input[type='checkbox']",
    "input[type='radio']",
    "input[type='range']",
    "input[type='date']",
    "input[type='time']",
    "input[type='datetime-local']",
    "input[type='month']",
    "input[type='week']",
    "input[type='color']",
    "input[type='file']",
    "select",
    "textarea",
    "[contenteditable]:not([contenteditable='false'])"
].join(",");

var SCROLL_PIXELS_PER_SECOND = 1200;
var INPUT_HIGHLIGHT_CLASS = "shelix-input-highlight";
var INPUT_HIGHLIGHT_STYLE_ID = "shelix-input-highlight-style";
var KEY_HINT_STYLE_ID = "shelix-key-hint-style";
var KEY_HINT_CONTAINER_ID = "shelix-key-hint";
var KEY_HINT_MIN_WIDTH_PX = 260;
var KEY_HINT_MAX_WIDTH_PX = 640;
var KEY_HINT_VIEWPORT_MARGIN_PX = 24;
var FIND_UI_STYLE_ID = "shelix-find-style";
var FIND_UI_CONTAINER_ID = "shelix-find";
var FIND_UI_INPUT_ID = "shelix-find-input";
var FIND_UI_STATUS_ID = "shelix-find-status";
var FIND_UI_PREVIOUS_BUTTON_ID = "shelix-find-previous";
var FIND_UI_NEXT_BUTTON_ID = "shelix-find-next";
var FIND_UI_DONE_BUTTON_ID = "shelix-find-done";
var FIND_HIGHLIGHT_MATCH_NAME = "shelix-find-match";
var FIND_HIGHLIGHT_ACTIVE_NAME = "shelix-find-active";
var FIND_MATCH_LIMIT = 2000;
var FIND_DEBOUNCE_MS = 80;
var FIND_EXCLUDED_SEARCH_ANCESTOR_SELECTOR = "script, style, noscript, textarea, option";
var LINK_HINT_STYLE_ID = "shelix-link-hint-style";
var LINK_HINT_OVERLAY_ID = "shelix-link-hints";
var LINK_HINT_LABEL_CLASS = "shelix-link-hint-label";

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

var READING_PROGRESS_BAR_ID = "shelix-reading-progress";
var READING_PROGRESS_STYLE_ID = "shelix-reading-progress-style";
