({
    doInit: function (component) {
        var action = component.get('c.hasBetaAccess');
        action.setCallback(this, function (response) {
            var state = response.getState();
            console.log(state);
            if (state === 'SUCCESS') {
                component.set('v.betaAccess', response.getReturnValue());

                // You would typically fire a event here to trigger
                // client-side notification that the server-side
                // action is complete
            } else if (state === 'INCOMPLETE') {
                // do something
            } else if (state === 'ERROR') {
                var errors = response.getError();
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
    },
    handleChatEnded: function (component, event, helper) {
        var recordId = component.get('v.recordId');
        var eventRecordId = event.getParam('recordId');
        if (recordId === eventRecordId && component.get('v.betaAccess')) {
            helper.startTimer(component, eventRecordId);
        }
    },
    stopTimer: function (component) {
        component.set('v.stopped', true);
    }
});
