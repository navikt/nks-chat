public without sharing class Chat_SurveyHelper {
    /**
     * @description Function to get InvitationLink for a Case related to Chat
     * @param String chatKey
     * @return String InvitationLink
     */
    @AuraEnabled(cacheable=true)
    public static String getSurveyLink(String chatKey) {
        Id caseId = [SELECT CaseId FROM LiveChatTranscript WHERE ChatKey = :chatKey].CaseId;
        return [SELECT InvitationLink FROM SurveyInvitation WHERE Name = :caseId LIMIT 1]?.InvitationLink;
    }

    // TO Do
    /**
     * @description Function to check if user has already respond to Survey.
     */
}
