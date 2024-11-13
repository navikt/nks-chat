@isTest
private class NKS_ConversationEntryController_Test {
    @TestSetup
    static void makeData(){
        User thisUser = [ SELECT Id FROM User WHERE Id = :UserInfo.getUserId()];
        System.runAs (thisUser) {
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
        //ApiMock.setTestMock('', 200, 'OK');

        List<MessagingSession> messagingSessions = [SELECT Id, Status, ConversationId FROM MessagingSession LIMIT 1];
        
        // TODO: Status field is not writeable. What to do? Ignore status with regards to trigger tests?
        /*MessagingSession msgSession = messagingSessions[0];
        msgSession.Status = 'Ended';
        update msgSession;*/

        Test.startTest();
            NKS_ConversationEntryController.convertConversationEntries(messagingSessions, null, null,
            null, null);
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