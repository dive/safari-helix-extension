function getActiveScrollDirection() {
    return (state.isJPressed ? 1 : 0) + (state.isKPressed ? -1 : 0);
}

function stopScrollingLoop() {
    if (state.scrollAnimationFrame !== null) {
        window.cancelAnimationFrame(state.scrollAnimationFrame);
        state.scrollAnimationFrame = null;
    }

    state.lastScrollFrameTime = 0;
}

function tickScroll(timestamp) {
    const direction = getActiveScrollDirection();
    if (direction === 0) {
        stopScrollingLoop();
        return;
    }

    if (state.lastScrollFrameTime === 0) {
        state.lastScrollFrameTime = timestamp;
    }

    const elapsedMs = Math.min(50, timestamp - state.lastScrollFrameTime);
    state.lastScrollFrameTime = timestamp;
    const distance = direction * SCROLL_PIXELS_PER_SECOND * (elapsedMs / 1000);

    window.scrollBy({
        left: 0,
        top: distance,
        behavior: "auto"
    });

    state.scrollAnimationFrame = window.requestAnimationFrame(tickScroll);
}

function ensureScrollingLoop() {
    if (getActiveScrollDirection() === 0 || state.scrollAnimationFrame !== null) {
        return;
    }

    state.scrollAnimationFrame = window.requestAnimationFrame(tickScroll);
}

function clearScrollKeys() {
    state.isJPressed = false;
    state.isKPressed = false;
    stopScrollingLoop();
}
