const TAB_ACTION_MESSAGE_TYPE = "shelix.tabAction";
const TAB_ACTION = Object.freeze({
    NEXT: "next",
    PREVIOUS: "previous",
    NEW: "new",
    CLOSE: "close",
    DUPLICATE: "duplicate"
});

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

browser.runtime.onMessage.addListener(async (message, sender) => {
    if (message?.type !== TAB_ACTION_MESSAGE_TYPE) {
        return null;
    }

    try {
        if (message.action === TAB_ACTION.NEXT) {
            await switchTab(sender, 1);
        } else if (message.action === TAB_ACTION.PREVIOUS) {
            await switchTab(sender, -1);
        } else if (message.action === TAB_ACTION.NEW) {
            await createTab(sender);
        } else if (message.action === TAB_ACTION.CLOSE) {
            await closeTab(sender);
        } else if (message.action === TAB_ACTION.DUPLICATE) {
            await duplicateTab(sender);
        } else {
            return {
                ok: false
            };
        }

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
