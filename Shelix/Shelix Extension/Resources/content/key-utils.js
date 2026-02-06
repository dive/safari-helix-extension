function normalizeKey(event) {
    return event.key.toLowerCase();
}

function getActionKey(event) {
    const key = normalizeKey(event);
    if (event.shiftKey && key.length === 1 && key >= "a" && key <= "z") {
        return `shift+${key}`;
    }

    return key;
}

function formatKeyLabel(key) {
    if (key === " ") {
        return "Space";
    }

    if (key === "enter") {
        return "Enter";
    }

    if (key === "escape") {
        return "Esc";
    }

    return key;
}
