({
    onTabClosed: function (component, event, helper) {
        var closedTabId = event.getParam('tabId');
        helper.removeClosedChatTabId(component, closedTabId);
        helper.startTimer(component);
    },

    handleChatEnded: function (component, event, helper) {
        const eventRecordId = event.getParam('recordId');
        const workspace = component.find('workspace');
        const eventFullID = helper.convertId15To18(eventRecordId);

        workspace
            .getAllTabInfo()
            .then((res) => {
                const eventTab = res.find((content) => content.recordId === eventFullID);
                if (!eventTab) return;
                helper.storeClosedChatTabId(component, eventTab.tabId, eventFullID);
                helper.startTimer(component);
            })
            .catch(() => {
                //Errors require manual handling.
            });
    }
});
