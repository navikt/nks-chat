({
    callStoreConversation: function (component, conversation, recordId) {
        let storeAction = component.get('c.storeConversation');

        storeAction.setParams({
            chatId: recordId,
            jsonConversation: JSON.stringify(conversation)
        });

        storeAction.setCallback(this, function (response) {
            let state = response.getState();
            if (state === 'SUCCESS') {
                //Conversation stored successfully
            } else {
                //Error handling
            }
        });

        $A.enqueueAction(storeAction);
    },

    setTabLabelAndIcon: function (component, tabId, recordId) {
        var workspace = component.find('workspace');
        var action = component.get('c.getChatTranscript');

        action.setParams({ recordId: recordId });
        action.setCallback(this, function (data) {
            if (data.getReturnValue()) {
                //Set icon based on auth status
                if (data.getReturnValue().CRM_Authentication_Status__c === 'Completed') {
                    this.setTabIcon(workspace, tabId, 'utility:lock', 'Innlogget chat');
                } else {
                    this.setTabIcon(workspace, tabId, 'standard:live_chat', 'Uinnlogget chat');
                }

                //Set tab label
                if (data.getReturnValue().LiveChatButton && data.getReturnValue().LiveChatButton.MasterLabel) {
                    let label = data.getReturnValue().LiveChatButton.MasterLabel.replace('_', ' ');
                    let caseNumber = '';
                    if (data.getReturnValue().Case && data.getReturnValue().Case.CaseNumber) {
                        caseNumber = data
                            .getReturnValue()
                            .Case.CaseNumber.substring(data.getReturnValue().Case.CaseNumber.length - 2);
                    }

                    workspace.setTabLabel({
                        tabId: tabId,
                        label: `${label}${caseNumber ? ` ${caseNumber}` : ''}`
                    });
                }
            }
        });
        $A.enqueueAction(action);
    },

    setTabIcon: function (workspace, newTabId, iconName, iconAlt) {
        workspace.setTabIcon({
            tabId: newTabId,
            icon: iconName,
            iconAlt: iconAlt
        });
    }
});
