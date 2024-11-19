global with sharing class NKS_MessagingSessionHandler extends MyTriggers {
    private static LoggerUtility logger = new LoggerUtility('Messaging');

    global override void onAfterUpdate(Map<Id, sObject> triggerOldMap) {
        List<String> fieldNamesToCheck = new List<String>{
            'EndTime',
            'Status',
            'CRM_Authentication_Status__c'
        };
        List<MessagingSession> messagingSessionsToConvert = new List<MessagingSession>();

        for (MessagingSession msgSession : (List<MessagingSession>) records) {
            MessagingSession oldRecord = (MessagingSession) triggerOldMap.get(msgSession.Id);

            if (MyTriggers.hasChangedFields(fieldNamesToCheck, msgSession, oldRecord) && msgSession.EndTime <= Datetime.now() && msgSession.CRM_Authentication_Status__c == 'Completed' && (msgSession.Status == 'Ended' || msgSession.Status == 'Inactive')) {
                messagingSessionsToConvert.add(msgSession);
            }
        }

        if (messagingSessionsToConvert.size() > 0) {
            System.enqueueJob(new NKS_ConversationEntryQueueable(messagingSessionsToConvert));
        }
    }
}