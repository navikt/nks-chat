({
    handleChatEnded: function (component, event, helper) {
        const recordId = component.get('v.recordId');
        const eventRecordId = event.getParam('recordId');
        if (recordId === eventRecordId) {
            helper.startTimer(component, eventRecordId);
        }

        // Dispatch custom event when the session ends
        const sessionEnded = $A.get('e.c:afterworkEvent');
        sessionEnded.setParams({
            recordId: eventRecordId
        });
        sessionEnded.setParams({ type: 'sessionEnded' });
        sessionEnded.fire();
    },

    stopTimer: function (component) {
        component.set('v.stopped', true);
        const action = component.get('c.reportThreatClick');
        action.setCallback(this, function (response) {
            const state = response.getState();
            if (state === 'SUCCESS') {
                const reportingId = response.getReturnValue();
                const appEvent = $A.get('e.c:afterworkEvent');
                const recordId = component.get('v.recordId');
                appEvent.setParams({ reportingId: reportingId });
                appEvent.setParams({ recordId: recordId });
                appEvent.setParams({ type: 'createdThreatReport' });
                appEvent.fire();

                // You would typically fire a event here to trigger
                // client-side notification that the server-side
                // action is complete
            } else if (state === 'INCOMPLETE') {
                // do something
            } else if (state === 'ERROR') {
                const errors = response.getError();
                if (errors) {
                    if (errors[0] && errors[0].message) {
                        console.log('Error message: ' + errors[0].message);
                    }
                } else {
                    console.log('Unknown error');
                }
            }
        });

        $A.enqueueAction(action);
    }
});
