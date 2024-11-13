global with sharing class NKS_MessagingSessionHandler extends MyTriggers {
    private static LoggerUtility logger = new LoggerUtility('Messaging');

    global override void onAfterUpdate(Map<Id, sObject> triggerOldMap) {
        logger.info('MessagingSession trigger fired', null, CRM_ApplicationDomain.Domain.NKS);
        logger.publish();
        List<String> fieldNamesToCheck = new List<String>{
            'EndTime',
            'Status'
        };
        List<MessagingSession> messagingSessionsToConvert = new List<MessagingSession>();

        for (MessagingSession msgSession : (List<MessagingSession>) records) {
            MessagingSession oldRecord = (MessagingSession) triggerOldMap.get(msgSession.Id);

            System.debug('MessagingSession Trigger sup');
            if (MyTriggers.hasChangedFields(fieldNamesToCheck, msgSession, oldRecord) && oldRecord.EndTime <= Datetime.now() && (oldRecord.Status == 'Ended' || oldRecord.Status == 'Inactive')) {
                logger.info('MessagingSession trigger criteria', null, CRM_ApplicationDomain.Domain.NKS);
                logger.publish();
                messagingSessionsToConvert.add(msgSession);
            }
        }

        if (messagingSessionsToConvert.size() > 0) {
            new NKS_ConversationEntryQueueable(messagingSessionsToConvert, null, null, null, null);
        }
    }
}