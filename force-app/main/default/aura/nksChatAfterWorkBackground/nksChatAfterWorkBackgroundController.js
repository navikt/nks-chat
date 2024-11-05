({
    init: function (component, event, helper) {
        const empApi = component.find('empApi');

        if (empApi) {
            const channel = '/event/Messaging_Session_Event__e';
            empApi.subscribe(
                channel,
                -1,
                $A.getCallback(function (eventReceived) {
                    helper.handleChatEnded(component, eventReceived, helper);
                })
            );
        } else {
            console.error('empApi is undefined');
        }
    },

    onTabClosed: function (component, event, helper) {
        const closedTabId = event.getParam('tabId');
        helper.removeClosedChatTabId(component, closedTabId, helper);
        helper.startTimer(component);
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
