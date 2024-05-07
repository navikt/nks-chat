({
    handleChatEnded: function (component, event, helper) {
        let storeAction = component.get('c.logoutFromChatSession');
        const eventRecordId = event.getParam('recordId');
        const recordId = helper.convertId15To18(eventRecordId);

        storeAction.setParams({
            chatTranscriptId: recordId
        });

        storeAction.setCallback(this, function (response) {
            let state = response.getState();
            if (state === 'SUCCESS') {
                //Conversation stored successfully
            } else {
                const logger = component.find('loggerUtility');
                logger.logError('NKS', 'Chat', response.getError(), 'Feil med å logge ut fra chat session', recordId);
            }
        });

        $A.enqueueAction(storeAction);
    }
});
