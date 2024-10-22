({
    handleCloseTab: function (component, message) {
        if (message.getParam('action') === 'closeTab') {
            const recordId = message.getParam('recordId');
            const workspaceAPI = component.find('workspace');

            workspaceAPI
                .getAllTabInfo()
                .then((tabInfo) => {
                    const currentTab = tabInfo.find((tab) => tab.recordId === recordId);
                    if (currentTab) {
                        workspaceAPI.closeTab({ tabId: currentTab.tabId });
                    }
                })
                .catch((error) => {
                    console.error('Error closing tab:', error);
                });
        }
    }
});
