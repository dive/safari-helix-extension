function getActiveScrollDirection() {
    return (state.isJPressed ? 1 : 0) + (state.isKPressed ? -1 : 0);
}

function stopScrollingLoop() {
    if (state.scrollAnimationFrame !== null) {
        window.cancelAnimationFrame(state.scrollAnimationFrame);
        state.scrollAnimationFrame = null;
    }

    state.lastScrollFrameTime = 0;
    state.scrollBoundaryFrames = 0;
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

    const scrollBefore = window.scrollY;
    window.scrollBy({
        left: 0,
        top: distance,
        behavior: "auto"
    });

    if (window.scrollY === scrollBefore) {
        state.scrollBoundaryFrames += 1;
        if (state.scrollBoundaryFrames >= 3) {
            stopScrollingLoop();
            return;
        }
    } else {
        state.scrollBoundaryFrames = 0;
    }

    state.scrollAnimationFrame = window.requestAnimationFrame(tickScroll);
}

function ensureScrollingLoop() {
    if (getActiveScrollDirection() === 0 || state.scrollAnimationFrame !== null) {
        return;
    }

    state.scrollBoundaryFrames = 0;
    state.scrollAnimationFrame = window.requestAnimationFrame(tickScroll);
}

function clearScrollKeys() {
    state.isJPressed = false;
    state.isKPressed = false;
    stopScrollingLoop();
    state.discreteScrollPending = false;
    state.discreteScrollQueue = 0;
}

function canUseScrollend() {
    return "onscrollend" in window;
}

function finishDiscreteScroll() {
    state.discreteScrollPending = false;
    if (state.discreteScrollQueue !== 0) {
        const queued = state.discreteScrollQueue;
        state.discreteScrollQueue = 0;
        runDiscreteScroll(queued);
    }
}

function runDiscreteScroll(deltaY) {
    if (state.discreteScrollPending) {
        state.discreteScrollQueue += deltaY;
        return;
    }

    state.discreteScrollPending = true;
    state.discreteScrollQueue = 0;

    const useSmooth = canUseScrollend()
        && !window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    if (useSmooth) {
        const target = document.scrollingElement || document.documentElement;
        const handler = () => {
            target.removeEventListener("scrollend", handler);
            finishDiscreteScroll();
        };
        target.addEventListener("scrollend", handler, { once: true });
        setTimeout(() => {
            target.removeEventListener("scrollend", handler);
            if (state.discreteScrollPending) {
                finishDiscreteScroll();
            }
        }, 800);
    }

    window.scrollBy({ left: 0, top: deltaY, behavior: useSmooth ? "smooth" : "auto" });

    if (!useSmooth) {
        finishDiscreteScroll();
    }
}
