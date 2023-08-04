({
    handleChatEnded: function (component, event, helper) {
        var recordId = component.get('v.recordId');
        var eventRecordId = event.getParam('recordId');
        if (recordId === eventRecordId) {
            helper.startTimer(component, eventRecordId);
        }
    },
    onInit: function (component, event, helper) {
        console.log('Sup');
        helper.startTimer(component, component.get('v.recordId'));
    }
});
