global with sharing class NKS_MessagingSessionHandler extends MyTriggers {

    global override void onAfterUpdate(Map<Id, sObject> triggerOldMap) {
        List<String> fieldNamesToCheck = new List<String>{
            'EndTime',
            'Status'
        };
        List<MessagingSession> messagingSessionsToConvert = new List<MessagingSession>();

        for (MessagingSession msgSession : (List<MessagingSession>) records) {
            MessagingSession oldRecord = (MessagingSession) triggerOldMap.get(msgSession.Id);

            if (MyTriggers.hasChangedFields(fieldNamesToCheck, msgSession, oldRecord) && oldRecord.EndTime <= Datetime.now() && oldRecord.Status == 'Ended') {
                messagingSessionsToConvert.add(msgSession);
            }
        }

        if (messagingSessionsToConvert.size() > 0) {
            new NKS_ConversationEntryQueueable(messagingSessionsToConvert, null, null, null, null);
        }
    }
}