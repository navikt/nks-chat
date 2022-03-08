({
    showLoginMsg: function (component, event) {
        const chatToolkit = component.find('chatToolkit');
        const recordId = component.get('v.recordId');
        const loginMsg = event.getParam('loginMessage');

        chatToolkit
            .sendMessage({
                recordId: recordId,
                message: {
                    text: loginMsg
                }
            })
            .then(function (result) {
                //Message success
            });
    }
});
