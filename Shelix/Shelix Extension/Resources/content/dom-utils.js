function isTargetInsideFindUi(target) {
    if (!(target instanceof Element)) {
        return false;
    }

    return Boolean(target.closest(`#${FIND_UI_CONTAINER_ID}`));
}

function isTargetInsideShelixUi(target) {
    if (!(target instanceof Element)) {
        return false;
    }

    return Boolean(target.closest(`#${FIND_UI_CONTAINER_ID}, #${KEY_HINT_CONTAINER_ID}`));
}

function getInputSelectionSnapshot(input) {
    return {
        start: input.selectionStart,
        end: input.selectionEnd,
        direction: input.selectionDirection
    };
}

function getEditableTarget(target) {
    if (!(target instanceof Element)) {
        return null;
    }

    if (isTargetInsideFindUi(target)) {
        return null;
    }

    const editable = target.closest(INPUT_FIELD_SELECTOR);
    if (!editable || isTargetInsideFindUi(editable)) {
        return null;
    }

    if (editable instanceof HTMLInputElement || editable instanceof HTMLTextAreaElement) {
        if (editable.disabled || editable.readOnly) {
            return null;
        }
    }

    return editable;
}

function isEditableTarget(target) {
    return getEditableTarget(target) !== null;
}

function isNavigableField(field) {
    if (!(field instanceof HTMLElement) || isTargetInsideFindUi(field)) {
        return false;
    }

    const style = window.getComputedStyle(field);
    if (style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse") {
        return false;
    }

    if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
        if (field.disabled || field.readOnly) {
            return false;
        }
    }

    const rect = field.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
}

function getNavigableFields() {
    return Array.from(document.querySelectorAll(INPUT_FIELD_SELECTOR)).filter(isNavigableField);
}

function getFindRangeContainerElement(range) {
    if (range.startContainer instanceof Element) {
        return range.startContainer;
    }

    return range.startContainer.parentElement;
}

function isElementVisibleForFind(element) {
    if (!(element instanceof Element) || !element.isConnected || isTargetInsideShelixUi(element)) {
        return false;
    }

    let current = element;
    while (current) {
        if (current instanceof HTMLElement && current.hidden) {
            return false;
        }

        const style = window.getComputedStyle(current);
        if (style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse") {
            return false;
        }

        current = current.parentElement;
    }

    const rects = element.getClientRects();
    for (const rect of rects) {
        if (rect.width > 0 && rect.height > 0) {
            return true;
        }
    }

    return false;
}
