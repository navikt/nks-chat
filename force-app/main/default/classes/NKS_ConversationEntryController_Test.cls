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
            msgSession.Status = 'New';
            insert msgSession;
        }
    }

    // TODO: Insert not allowed on Conversation. Need to cheese conversationIdentifier and mock response data of conv entries
    @isTest
    static void testConvertConversationEntries() {
        // TODO: Mock Conversation Entry response from Connect API
        Test.setMock(
            HttpCalloutMock.class,
            new SingleRequestMock(200, 'OK', '{"conversationEntries":[{"clientDuration":0,"clientTimestamp":1731401738134,"identifier":"17978db9-ed91-4363-adcb-d1b581168eed","messageText":"https://navdialog--sit2.sandbox.my.site.com/nks/s/identity-verified?ctid=0MwKD0000004CWb0AM","relatedRecords":["0MwKD0000004CWb"],"sender":{"appType":"agent","role":"Agent","subject":"0055t000005CmwY"},"serverReceivedTimestamp":1731401739478},{"clientDuration":0,"clientTimestamp":1731401738134,"identifier":"8360751b-0a0f-4f0c-b62f-772f15140efa","messageText":"Trykk for å logge inn på nav.no og gi veilederen tilgang til saken din.","relatedRecords":["0MwKD0000004CWb"],"sender":{"appType":"agent","role":"Agent","subject":"0055t000005CmwY"},"serverReceivedTimestamp":1731401739477}]}', null)
        );
 
        List<MessagingSession> messagingSessions = [
            SELECT Id, Status, Conversation.ConversationIdentifier
            FROM MessagingSession
            LIMIT 1
        ];

        // Set read-only field with JSON deserialization
        String msgSessionJson =
            '{' +
            '"Id": "' +
            messagingSessions[0].Id +
            '",' +
            '"Status": "Ended",' +
            '"EndedBy": "System",' +
            '"CRM_Authentication_Status__c": "Completed"' +
            '}';

        MessagingSession jsonMesssagingSession = (MessagingSession) JSON.deserialize(
            msgSessionJson,
            MessagingSession.class
        );
        update jsonMesssagingSession;

        List<MessagingSession> changedMessagingSession = [
            SELECT Id, Status, Conversation.ConversationIdentifier
            FROM MessagingSession
            WHERE Id = :messagingSessions[0].Id
            LIMIT 1
        ];

        Test.startTest();
        NKS_ConversationEntryController.convertConversationEntries(changedMessagingSession, null, null, null, null);
        Test.stopTest();

        List<Thread__c> threads = [SELECT Id FROM Thread__c WHERE CRM_Related_Object__c = :messagingSessions[0].Id];
        //System.assert(threads.size() == 1, 'There should be 1 thread created');

        List<Id> threadIds = new List<Id>();
        for (Thread__c thread : threads) {
            threadIds.add(thread.Id);
        }

        List<Message__c> messages = [SELECT Id FROM Message__c WHERE Id IN :threadIds];
        //System.assert(messages.size() > 0, 'Messages should be inserted');
    }
}
