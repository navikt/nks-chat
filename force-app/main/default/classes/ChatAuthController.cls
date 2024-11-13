public without sharing class ChatAuthController {
    @AuraEnabled
    public static void setStatusRequested(Id messagingId) {
        ChatAuthControllerExperience.setStatus(messagingId, 'Authentication Requested');
    }

    /**
     * @description: Returns the CRM_Authentication_Status__c, and status of the chat transcript
     * @author Stian Ruud Schikora | 09-04-2020
     * @param messagingId [STRING]
     * @return messagingInfo [MAP<STRING, STRING>]
     **/
    @AuraEnabled(Cacheable=true)
    public static Map<String, String> getMessagingInfo(String messagingId) {
        Map<String, String> messagingInfo;
        try {
            MessagingSession session = [
                SELECT
                    Id,
                    CRM_Authentication_Status__c,
                    MessagingEndUser.AccountId,
                    MessagingEndUser.Account.CRM_Person__c,
                    MessagingEndUser.Account.CRM_Person__r.INT_Confidential__c,
                    MessagingEndUser.Account.CRM_Person__r.INT_IsNavEmployee__c,
                    MessagingEndUser.Account.CRM_Person__r.NKS_NumberOfSecurityMeasures__c
                FROM MessagingSession
                WHERE Id = :messagingId
            ];
            // TODO: Figure out the Messaging equivalent of theses fields
            // LiveChatButton.WindowLanguage,
            // Status,
            // EndTime
            messagingInfo = new Map<String, String>{
                'AUTH_STATUS' => session.CRM_Authentication_Status__c,
                'ACCOUNTID' => session.MessagingEndUser.AccountId,
                'PERSONID' => session.MessagingEndUser.Account.CRM_Person__c,
                'IS_NAV_EMPLOYEE' => isNavEmployee(session),
                'IS_CONFIDENTIAL' => '' + personIsConfidential(session),
                'NMB_SECURITY_MEASURES' => numberOfSecurityMeasures(session)
            };
            // TODO: Figure out the equivalent here aswell
            // 'CASEID' => session.CaseId,
            // 'CHAT_LANGUAGE' => String.isNotBlank(session.LiveChatButton.WindowLanguage)
            // ? session.LiveChatButton.WindowLanguage
            // : 'no',
            // 'CONVERSATION_STATUS' => session.Status,
            // 'END_TIME' => string.valueOf(session.EndTime)
            return messagingInfo;
        } catch (Exception ex) {
            throw new AuraHandledException(ex.getTypeName() + ' : ' + 'Could not retrieve authentication status');
        }
    }

    private static String personIsConfidential(MessagingSession session) {
        if (String.isNotBlank(session.MessagingEndUser.AccountId)) {
            return session.MessagingEndUser.Account.CRM_Person__r.INT_Confidential__c.equalsIgnoreCase('UGRADERT')
                ? 'false'
                : 'true';
        }
        return 'false';
    }

    private static String isNavEmployee(MessagingSession session) {
        if (String.isNotBlank(session.MessagingEndUser.AccountId)) {
            return session.MessagingEndUser.Account.CRM_Person__r.INT_IsNavEmployee__c ? 'true' : 'false';
        }
        return 'false';
    }

    private static String numberOfSecurityMeasures(MessagingSession session) {
        if (String.isNotBlank(session.MessagingEndUser.AccountId)) {
            return '' + session.MessagingEndUser.Account.CRM_Person__r.NKS_NumberOfSecurityMeasures__c;
        }

        return '0';
    }

    @AuraEnabled
    public static string getCounselorName(String recordId) {
        Id ownerId = [SELECT OwnerId FROM MessagingSession WHERE Id = :recordId LIMIT 1]?.OwnerId;
        String fullname = [SELECT NKS_FullName__c FROM User WHERE Id = :ownerId LIMIT 1]?.NKS_FullName__c;
        return fullname;
    }
}
