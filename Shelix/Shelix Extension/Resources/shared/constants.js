(function installShelixSharedConstants() {
    if (globalThis.ShelixShared) {
        return;
    }

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

    globalThis.ShelixShared = Object.freeze({
        TAB_ACTION_MESSAGE_TYPE,
        TAB_ACTION,
        ACTION,
        NORMAL_MODE_ACTIONS,
        PREFIX_ACTIONS,
        PREFIX_TITLES,
        ACTION_LABELS,
        HELP_KEY_HINT_ROWS
    });
}());
