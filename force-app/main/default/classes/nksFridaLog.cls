public without sharing class nksFridaLog {
    public static String getChatbotMessage(Id chatId, Id accountId) {
        List<Case> caseRef = [SELECT Description FROM Case WHERE SourceId = :chatId AND accountId = :accountId LIMIT 1];
        if (caseRef.size() == 0) {
            return 'Det oppstod en feil';
        }
        return NKS_ChatTranscriptService.formatBotConversation(caseRef[0].Description);
    }
}
