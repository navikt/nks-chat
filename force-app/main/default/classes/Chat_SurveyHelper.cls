public without sharing class Chat_SurveyHelper {
    /**
     * @description Function to get InvitationLink for a Case related to Chat
     * @param String chatKey
     * @return String surveyInvitationLink
     */
    @AuraEnabled(cacheable=true)
    public static String getSurveyLink(String chatKey) {
        try {
            Id caseId = [SELECT CaseId FROM LiveChatTranscript WHERE ChatKey = :chatKey LIMIT 1]?.CaseId;
            return [SELECT InvitationLink FROM SurveyInvitation WHERE Name = :caseId LIMIT 1]?.InvitationLink;
        } catch (QueryException e) {
            throw new AuraHandledException(
                'An error has occurred on getting LiveChatTranscript or SurveyInvitation: ' + e.getMessage()
            );
        }
    }
}
