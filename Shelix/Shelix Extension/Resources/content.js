// Shelix content script bootstrap.
if (!globalThis.__shelixContentInitialized) {
    globalThis.__shelixContentInitialized = true;
    initializeShelixEventHandlers();
}
