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
    },

    highlightChatTab: function (component) {
        let workspaceAPI = component.find('workspace');
        //Getting the enclosing tab. NEED TO VERIFY THIS WITH MULTIPLE CHAT TABS!
        workspaceAPI
            .getEnclosingTabId()
            .then(function (tabId) {
                console.log(tabId);
                workspaceAPI.setTabHighlighted({
                    tabId: tabId,
                    highlighted: true,
                    options: {
                        pulse: true,
                        state: 'success'
                    }
                });
            })
            .catch(function (error) {
                console.log(error);
            });
    }
});
