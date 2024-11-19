({
    requestAuthentication: function (component, event) {
        const chatToolkit = component.find('chatToolkit');
        const recordId = component.get('v.recordId');
        const authInfoCmp = component.find('chatAuthInfo');
        const authUrl = event.getParam('authUrl');

        const action = component.get('c.generateAuthMessage');
        action.setParams({ recordId });

        action.setCallback(this, function (response) {
            const state = response.getState();
            if (state === 'SUCCESS') {
                const authMessage = response.getReturnValue() + authUrl + recordId;

                chatToolkit
                    .sendMessage({
                        recordId,
                        message: { text: authMessage }
                    })
                    .then((result) => {
                        authInfoCmp.authRequestHandling(result);
                    })
                    .catch((error) => {
                        console.error('Error sending authentication message:', JSON.stringify(error));
                    });
            } else if (state === 'ERROR') {
                const errors = response.getError();
                if (errors && errors[0] && errors[0].message) {
                    console.error('Error message:', errors[0].message);
                } else {
                    console.error('Unknown error occurred');
                }
            }
        });

        $A.enqueueAction(action);
    },

    handleAuthCompleted: function (component, event, helper) {
        if (component.get('v.authCompletedHandled')) {
            return;
        }

        component.set('v.authCompletedHandled', true);
        helper.showLoginMsg(component, event);
    },

    handleChatEnded: function (component, event) {
        const eventRecordId = event.getParam('recordId');
        const recordId = component.get('v.recordId');

        if (eventRecordId === recordId) {
            component.set('v.authCompletedHandled', false);
        }
    }
});
