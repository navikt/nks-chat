({
    handleChatEnded: function (component, event, helper) {
        var recordId = component.get('v.recordId');
        var eventTabId = event.getParam('tabId');
        var eventRecordId = event.getParam('recordId');
        if (recordId === eventRecordId) {
            helper.startTimer(component, event);
            component.set('v.chatEnded', true);
        }
    },
    testButton: function (component, event, helper) {
        console.log('niceer');
        helper.startTimer(component, event);
        component.set('v.chatEnded', true);
        console.log('niceering');
    }
});
