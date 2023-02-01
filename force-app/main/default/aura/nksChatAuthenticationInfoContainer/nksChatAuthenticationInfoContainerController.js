({
    //Called when the component loads
    onInit: function (component, event, helper) {
        // Get the empApi component
        const empApi = component.find('empApi');

        // Uncomment below line to enable debug logging (optional)
        // empApi.setDebugFlag(true);

        // Register error listener and pass in the error handler function
        empApi.onError(
            $A.getCallback((error) => {
                // Error can be any type of error (subscribe, unsubscribe...)
                console.error('EMP API error: ', JSON.stringify(error));
            })
        );

        //Subscribe to empApi events
        helper.subscribeEmpApi(component);
    },

    //Handles event from LWC to init the auth process using the conversation toolkit API
    requestAuthentication: function (component, event, helper) {
        const chatToolkit = component.find('chatToolkit');
        const recordId = component.get('v.recordId');
        const authInfoCmp = component.find('chatAuthInfo');
        let authUrl = event.getParam('authUrl');

        chatToolkit
            .sendMessage({
                recordId: recordId,
                message: {
                    text: 'Klikk på lenken under for å logge inn. ' + authUrl + recordId
                }
            })
            .then(function (result) {
                //Call child to handle message result
                authInfoCmp.authRequestHandling(result);
            });
    },

    handleAuthCompleted: function (component, event, helper) {
        helper.showLoginMsg(component, event);
    }
});
