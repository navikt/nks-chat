({
    callStoreConversation: function (component, conversation, recordId) {
        const storeAction = component.get('c.storeConversation');
        storeAction.setParams({
            chatId: recordId,
            jsonConversation: JSON.stringify(conversation)
        });

        storeAction.setCallback(this, function (response) {
            const state = response.getState();
            if (state !== 'SUCCESS') {
                console.error('Error storing conversation:', response.getError());
            }
        });

        $A.enqueueAction(storeAction);
    },

    setTabLabelAndIcon: function (component, tabId, recordId) {
        const workspace = component.find('workspace');
        const action = component.get('c.getMessagingSession');
        action.setParams({ recordId: recordId });

        action.setCallback(this, function (response) {
            const sessionInfo = response.getReturnValue();
            if (sessionInfo) {
                if (sessionInfo.CRM_Authentication_Status__c) {
                    const icon =
                        sessionInfo.CRM_Authentication_Status__c === 'Completed'
                            ? { name: 'utility:lock', alt: 'Innlogget chat' }
                            : { name: 'standard:live_chat', alt: 'Uinnlogget chat' };
                    this.setTabIcon(workspace, tabId, icon.name, icon.alt);
                }

                if (sessionInfo.Queue_Name__c) {
                    const queueName = sessionInfo.Queue_Name__c.split('_').pop();
                    const tabNumber = sessionInfo.Name ? sessionInfo.Name.slice(-2) : '';
                    const label = `Chat ${queueName} ${tabNumber}`;
                    workspace.setTabLabel({ tabId: tabId, label: label });
                }

                if (sessionInfo.Status === 'Ended') {
                    this.setTabColor(workspace, tabId, 'success');
                }
            }
        });

        $A.enqueueAction(action);
    },

    setTabIcon: function (workspace, tabId, iconName, iconAlt) {
        workspace.setTabIcon({
            tabId: tabId,
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
        if (Id.length !== 15) return Id;

        let addon = '';
        for (let block = 0; block < 3; block++) {
            let loop = 0;
            for (let position = 0; position < 5; position++) {
                const char = Id.charAt(block * 5 + position);
                if (char >= 'A' && char <= 'Z') loop += 1 << position;
            }
            addon += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ012345'.charAt(loop);
        }
        return Id + addon;
    }
});
