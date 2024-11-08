({
    onTabClosed: function (component, event, helper) {
        const closedTabId = event.getParam('tabId');
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
            })
            .catch((error) => {
                console.error('Error retrieving tab info: ', error);
            });
    },

    handleThreatReport: function (component, event, helper) {
        const type = event.getParam('type');
        if (type === 'createdThreatReport') {
            const recordId = event.getParam('recordId');
            const reportingId = event.getParam('reportingId');
            helper.storeThreatReport(component, reportingId, recordId);
        }
    }
});
