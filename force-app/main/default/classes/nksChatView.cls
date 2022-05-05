public with sharing class nksChatView {
    @AuraEnabled(cacheable=true)
    public static Id getThreadId(String chatId) {
        List<Thread__c> thread = [SELECT Id FROM Thread__c WHERE CRM_Related_Object__c = :chatId LIMIT 1];
        if (thread.size() > 0) {
            return thread[0].Id;
        }
        return null;
    }

    @AuraEnabled(cacheable=true)
    public static String getChatbotMessage(Id chatId) {
        List<Case> caseRef = [SELECT Description FROM Case WHERE SourceId = :chatId LIMIT 1];
        if (caseRef.size() == 0) {
            return 'Det oppstod en feil';
        }
        return NKS_ChatTranscriptService.formatBotConversation(caseRef[0].Description);
    }
}
