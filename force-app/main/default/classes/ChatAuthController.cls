public without sharing class ChatAuthController {
    /**
     * @description: Returns the CRM_Authentication_Status__c, and status of the chat transcript
     * @author Stian Ruud Schikora | 09-04-2020
     * @param chatTranscriptId [STRING]
     * @return chatInfo [MAP<STRING, STRING>]
     **/
    @AuraEnabled(Cacheable=true)
    public static Map<String, String> getChatInfo(String chatTranscriptId) {
        Map<String, String> chatInfo;
        try {
            LiveChatTranscript trans = [
                SELECT
                    Id,
                    CRM_Authentication_Status__c,
                    AccountId,
                    Account.CRM_Person__c,
                    Account.CRM_Person__r.INT_Confidential__c,
                    Account.CRM_Person__r.INT_IsNavEmployee__c,
                    Account.CRM_Person__r.NKS_NumberOfSecurityMeasures__c,
                    CaseId,
                    LiveChatButton.WindowLanguage,
                    Status,
                    EndTime
                FROM LiveChatTranscript
                WHERE Id = :chatTranscriptId
            ];
            chatInfo = new Map<String, String>{
                'AUTH_STATUS' => trans.CRM_Authentication_Status__c,
                'CONVERSATION_STATUS' => trans.Status,
                'ACCOUNTID' => trans.accountId,
                'CASEID' => trans.CaseId,
                'PERSONID' => trans.Account.CRM_Person__c,
                'IS_NAV_EMPLOYEE' => isNavEmployee(trans),
                'IS_CONFIDENTIAL' => '' + personIsConfidential(trans),
                'NMB_SECURITY_MEASURES' => numberOfSecurityMeasures(trans),
                'CHAT_LANGUAGE' => String.isNotBlank(trans.LiveChatButton.WindowLanguage)
                    ? trans.LiveChatButton.WindowLanguage
                    : 'no',
                'END_TIME' => string.valueOf(trans.EndTime)
            };
            return chatInfo;
        } catch (Exception ex) {
            throw new AuraHandledException(ex.getTypeName() + ' : ' + 'Could not retrieve authentication status');
        }
    }

    private static String personIsConfidential(LiveChatTranscript trans) {
        if (String.isNotBlank(trans.AccountId)) {
            return trans.Account.CRM_Person__r.INT_Confidential__c.equalsIgnoreCase('UGRADERT') ? 'false' : 'true';
        }
        return 'false';
    }

    private static String isNavEmployee(LiveChatTranscript trans) {
        if (String.isNotBlank(trans.AccountId)) {
            return trans.Account.CRM_Person__r.INT_IsNavEmployee__c ? 'true' : 'false';
        }
        return 'false';
    }

    private static String numberOfSecurityMeasures(LiveChatTranscript trans) {
        if (String.isNotBlank(trans.AccountId)) {
            return '' + trans.Account.CRM_Person__r.NKS_NumberOfSecurityMeasures__c;
        }

        return '0';
    }

    @AuraEnabled
    public static string getCounselorName(String recordId) {
        Id ownerId = [SELECT OwnerId FROM LiveChatTranscript WHERE Id = :recordId LIMIT 1]?.OwnerId;
        String fullname = [SELECT NKS_FullName__c FROM User WHERE Id = :ownerId LIMIT 1]?.NKS_FullName__c;
        return fullname;
    }
}
