import "./constants.js";

const shelixShared = globalThis.ShelixShared;
if (!shelixShared) {
    throw new Error("Shelix shared constants must load before background script.");
}

const { TAB_ACTION_MESSAGE_TYPE, TAB_ACTION } = shelixShared;

browser.runtime.onInstalled.addListener(() => {
    console.log("Shelix extension installed.");
});

async function getCurrentTab(sender) {
    if (sender?.tab?.id !== undefined) {
        return sender.tab;
    }

    const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true
    });

    return tabs[0] || null;
}

async function switchTab(sender, direction) {
    const currentTab = await getCurrentTab(sender);
    if (!currentTab || currentTab.id === undefined || currentTab.windowId === undefined) {
        return;
    }

    const tabs = await browser.tabs.query({
        windowId: currentTab.windowId
    });

    if (tabs.length < 2) {
        return;
    }

    const orderedTabs = tabs.slice().sort((first, second) => first.index - second.index);
    const currentIndex = orderedTabs.findIndex((tab) => tab.id === currentTab.id);
    if (currentIndex === -1) {
        return;
    }

    const nextIndex = (currentIndex + direction + orderedTabs.length) % orderedTabs.length;
    const targetTab = orderedTabs[nextIndex];
    if (targetTab?.id === undefined) {
        return;
    }

    await browser.tabs.update(targetTab.id, {
        active: true
    });
}

async function createTab(sender) {
    const currentTab = await getCurrentTab(sender);
    const createProperties = {
        active: true
    };

    if (currentTab?.windowId !== undefined) {
        createProperties.windowId = currentTab.windowId;
    }

    if (typeof currentTab?.index === "number") {
        createProperties.index = currentTab.index + 1;
    }

    await browser.tabs.create(createProperties);
}

async function closeTab(sender) {
    const currentTab = await getCurrentTab(sender);
    if (!currentTab || currentTab.id === undefined) {
        return;
    }

    await browser.tabs.remove(currentTab.id);
}

async function duplicateTab(sender) {
    const currentTab = await getCurrentTab(sender);
    if (!currentTab || currentTab.id === undefined) {
        return;
    }

    await browser.tabs.duplicate(currentTab.id);
}

const TAB_ACTION_HANDLERS = Object.freeze({
    [TAB_ACTION.NEXT]: (sender) => switchTab(sender, 1),
    [TAB_ACTION.PREVIOUS]: (sender) => switchTab(sender, -1),
    [TAB_ACTION.NEW]: (sender) => createTab(sender),
    [TAB_ACTION.CLOSE]: (sender) => closeTab(sender),
    [TAB_ACTION.DUPLICATE]: (sender) => duplicateTab(sender)
});

browser.runtime.onMessage.addListener(async (message, sender) => {
    if (message?.type !== TAB_ACTION_MESSAGE_TYPE) {
        return null;
    }

    const handler = TAB_ACTION_HANDLERS[message.action];
    if (!handler) {
        return {
            ok: false
        };
    }

    try {
        await handler(sender);
        return {
            ok: true
        };
    } catch (error) {
        console.error("Shelix tab action failed:", error);
        return {
            ok: false
        };
    }
});
