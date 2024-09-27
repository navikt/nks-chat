({
    onInit: function (component, event, helper) {
        const empApi = component.find('empApi');
        empApi.onError(
            $A.getCallback((error) => {
                console.error('EMP API error: ', JSON.stringify(error));
            })
        );
        helper.subscribeEmpApi(component);
    },

    requestAuthentication: function (component, event) {
        const chatToolkit = component.find('chatToolkit');
        const recordId = component.get('v.recordId');
        const authInfoCmp = component.find('chatAuthInfo');
        let authUrl = event.getParam('authUrl');

        chatToolkit
            .sendMessage({
                recordId: recordId,
                message: {
                    text:
                        'Trykk for å logge inn på nav.no og gi veilederen tilgang til saken din. ' + authUrl + recordId
                }
            })
            .then(function (result) {
                authInfoCmp.authRequestHandling(result);
            });
    },

    handleAuthCompleted: function (component, event, helper) {
        helper.showLoginMsg(component, event);
    },

    handleChatEnded: function (component, event) {
        const type = event.getParam('type');
        if (type === 'startTimer') {
            const eventRecordId = event.getParam('recordId');

            component.set('v.recordIdFromChatEndedEvent', eventRecordId);
            component.set('v.chatEnded', true);

            const authInfoCmp = component.find('chatAuthInfo');
            authInfoCmp.set('v.recordIdFromChatEndedEvent', eventRecordId);
            authInfoCmp.set('v.chatEnded', true);
        }
    }
});
