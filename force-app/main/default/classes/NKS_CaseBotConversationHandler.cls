global class NKS_CaseBotConversationHandler extends MyTriggers {
    global override void onBeforeUpdate(Map<Id, sObject> triggerOldMap) {
        for (Case casy : (List<Case>) Trigger.new) {
            Id sourceId = casy.sourceId;
            if (
                sourceId != null &&
                sourceId.getSobjectType().getDescribe().getName() == 'LiveChatTranscript' &&
                String.isBlank(casy.NKS_Conversation__c) &&
                String.isNotBlank(casy.Description)
            ) {
                handleBotConversation(casy);
            }
        }
    }

    private void handleBotConversation(Case casy) {
        //Formats the conversation and stores in the NKS_Conversation__c field
        String formattedConversation = NKS_ChatTranscriptService.formatBotConversation(casy.Description);
        casy.NKS_Conversation__c = formattedConversation;
        casy.NKS_Conversation_Stored__c = true;
    }
}
