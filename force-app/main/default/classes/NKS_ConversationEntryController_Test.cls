@isTest
private class NKS_ConversationEntryController_Test {
    @TestSetup
    static void makeData() {
        User thisUser = [SELECT Id FROM User WHERE Id = :UserInfo.getUserId()];
        System.runAs(thisUser) {
            MessagingChannel msgChannel = new MessagingChannel();
            msgChannel.MasterLabel = 'TestChannel';
            msgChannel.DeveloperName = 'TestChannel';
            msgChannel.IsActive = true;
            msgChannel.MessageType = 'Text';
            msgChannel.MessagingPlatformKey = 'TestChannel';
            insert msgChannel;

            MessagingEndUser msgEndUser = new MessagingEndUser();
            msgEndUser.Name = 'Messaging User';
            msgEndUser.MessagingChannelId = msgChannel.Id;
            msgEndUser.MessageType = 'EmbeddedMessaging';
            msgEndUser.MessagingPlatformKey = 'TestChannel';
            insert msgEndUser;

            MessagingSession msgSession = new MessagingSession();
            msgSession.MessagingEndUserId = msgEndUser.Id;
            msgSession.MessagingChannelId = msgChannel.Id;
            msgSession.Status = 'Ended';
            msgSession.EndTime = Datetime.now();
            insert msgSession;

            Thread__c thread = new Thread__c(CRM_Related_Object__c = msgSession.Id);
            insert thread;
        }
    }

    @isTest
    static void testConvertConversationEntries() {
        Test.setMock(
            HttpCalloutMock.class,
            new SingleRequestMock(200, 'OK', '{"conversationEntries":[{"clientDuration":0,"clientTimestamp":1731401738134,"identifier":"17978db9-ed91-4363-adcb-d1b581168eed","messageText":"https://navdialog--sit2.sandbox.my.site.com/nks/s/identity-verified?ctid=0MwKD0000004CWb0AM","relatedRecords":["0MwKD0000004CWb"],"sender":{"appType":"agent","role":"Agent","subject":"0055t000005CmwY"},"serverReceivedTimestamp":1731401739478},{"clientDuration":0,"clientTimestamp":1731401738134,"identifier":"8360751b-0a0f-4f0c-b62f-772f15140efa","messageText":"Trykk for å logge inn på nav.no og gi veilederen tilgang til saken din.","relatedRecords":["0MwKD0000004CWb"],"sender":{"appType":"agent","role":"Agent","subject":"0055t000005CmwY"},"serverReceivedTimestamp":1731401739477}]}', null)
        );
 
        List<MessagingSession> messagingSessions = [
            SELECT Id, Status, Conversation.ConversationIdentifier, CRM_Authentication_Status__c
            FROM MessagingSession
            LIMIT 1
        ];

        messagingSessions[0].CRM_Authentication_Status__c = 'Completed';

        Test.startTest();
        update messagingSessions;
        Test.stopTest();

        // TODO: Check if messages have been created
        String threadId = [SELECT Id FROM Thread__c WHERE CRM_Related_Object__c = :messagingSessions[0].Id].Id;
        //List<Message__c> messages = [SELECT Id FROM Message__c WHERE Id = :threadId];
        //System.assert(messages.size() > 0, 'Messages should be inserted');
    }
}
