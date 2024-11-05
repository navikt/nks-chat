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
        const workspace = component.find('workspace');
        const action = component.get('c.getMessagingSession');

        action.setParams({ recordId: recordId });
        action.setCallback(this, function (data) {
            if (data.getReturnValue()) {
                // This part is dependant to authentication for messaging
                /*
                if (data.getReturnValue().CRM_Authentication_Status__c === 'Completed') {
                    this.setTabIcon(workspace, tabId, 'utility:lock', 'Innlogget chat');
                } else {
                    this.setTabIcon(workspace, tabId, 'standard:live_chat', 'Uinnlogget chat');
                }
                */
                //Set tab label
                if (data.getReturnValue().Queue_Name__c) {
                    let queueName = data.getReturnValue().Queue_Name__c;
                    let label = 'Chat ' + queueName.split('_').pop();

                    let tabNumber = '';
                    if (data.getReturnValue().Name) {
                        tabNumber = data.getReturnValue().Name.slice(-2);
                    }

                    workspace.setTabLabel({
                        tabId: tabId,
                        label: `${label} ${tabNumber}`
                    });
                }

                //Set tab color
                if (data.getReturnValue().Status === 'Ended') {
                    this.setTabColor(workspace, tabId, 'success');
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
    },

    setTabColor: function (workspace, tabId, state) {
        workspace.setTabHighlighted({
            tabId: tabId,
            highlighted: true,
            options: { state: state }
        });
    },

    convertId15To18: function (Id) {
        if (Id.length === 15) {
            var addon = '';
            for (var block = 0; block < 3; block++) {
                var loop = 0;
                for (var position = 0; position < 5; position++) {
                    var current = Id.charAt(block * 5 + position);
                    if (current >= 'A' && current <= 'Z') loop += 1 << position;
                }
                addon += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ012345'.charAt(loop);
            }
            return Id + addon;
        }
        return Id;
    },

    handleChatEnded: function (component, event, helper) {
        const chatToolkit = component.find('chatToolkit');
        const eventRecordId = event.getParam('recordId');
        const workspace = component.find('workspace');
        const eventFullID = helper.convertId15To18(eventRecordId);

        workspace
            .getAllTabInfo()
            .then((res) => {
                const eventTab = res.find((content) => content.recordId === eventFullID);
                if (!eventTab) return;
                helper.setTabColor(workspace, eventTab.tabId, 'success');
            })
            .catch(() => {
                //Errors require manual handling.
            });

        chatToolkit
            .getChatLog({
                recordId: eventRecordId
            })
            .then((result) => {
                let conversation = result.messages;
                let filteredConversation = conversation.filter(function (message) {
                    //Filtering out all messages of type supervisor and AgentWhisper as these are "whispers" and should not be added to the journal
                    return message.type !== 'Supervisor' && message.type !== 'AgentWhisper';
                });
                helper.callStoreConversation(component, filteredConversation, eventRecordId);
            })
            .catch(() => {
                //Errors require manual handling.
            });
    }
});
