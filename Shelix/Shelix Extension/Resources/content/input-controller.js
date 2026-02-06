function syncHighlightVisibility() {
    if (!state.highlightedField || !state.highlightedField.isConnected) {
        return;
    }

    if (state.mode === "normal") {
        state.highlightedField.classList.add(INPUT_HIGHLIGHT_CLASS);
    } else {
        state.highlightedField.classList.remove(INPUT_HIGHLIGHT_CLASS);
    }
}

function setMode(nextMode) {
    state.mode = nextMode;
    if (state.mode !== "normal") {
        clearPendingPrefix();
    }

    syncHighlightVisibility();
}

function setHighlightedField(field) {
    if (state.highlightedField && state.highlightedField.isConnected) {
        state.highlightedField.classList.remove(INPUT_HIGHLIGHT_CLASS);
    }

    state.highlightedField = field;

    if (state.highlightedField) {
        ensureHighlightStyle();
        syncHighlightVisibility();
    }
}

function getHighlightedField(fields) {
    if (!state.highlightedField || !state.highlightedField.isConnected || !isNavigableField(state.highlightedField)) {
        setHighlightedField(null);
        return null;
    }

    if (Array.isArray(fields) && !fields.includes(state.highlightedField)) {
        setHighlightedField(null);
        return null;
    }

    return state.highlightedField;
}

function ensureHighlightedField() {
    const fields = getNavigableFields();
    if (fields.length === 0) {
        setHighlightedField(null);
        return null;
    }

    const existingHighlightedField = getHighlightedField(fields);
    if (existingHighlightedField) {
        return existingHighlightedField;
    }

    const activeEditableField = getEditableTarget(document.activeElement);
    if (activeEditableField && fields.includes(activeEditableField)) {
        setHighlightedField(activeEditableField);
        return activeEditableField;
    }

    setHighlightedField(fields[0]);
    return fields[0];
}

function highlightRelativeField(direction) {
    const fields = getNavigableFields();
    if (fields.length === 0) {
        setHighlightedField(null);
        return;
    }

    const currentField = getHighlightedField(fields);
    const currentIndex = currentField ? fields.indexOf(currentField) : -1;
    const nextIndex = currentIndex === -1
        ? (direction > 0 ? 0 : fields.length - 1)
        : (currentIndex + direction + fields.length) % fields.length;

    const nextField = fields[nextIndex];
    setHighlightedField(nextField);
    nextField.scrollIntoView({
        block: "center",
        inline: "nearest"
    });
}

function enterInsertMode(field) {
    if (!isNavigableField(field)) {
        return;
    }

    setMode("insert");
    clearScrollKeys();
    setHighlightedField(field);
    field.focus({
        preventScroll: true
    });
}

function exitInsertMode() {
    const activeEditableField = getEditableTarget(document.activeElement);
    if (activeEditableField instanceof HTMLElement) {
        setHighlightedField(activeEditableField);
        activeEditableField.blur();
    }

    setMode("normal");
    clearScrollKeys();
}
