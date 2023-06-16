@isTest
public with sharing class NKS_ChatTranscriptServiceTest {
    @TestSetup
    static void makeData() {
        Case casy = (Case) UTIL_TestDataFactory.createRecord(new Case());
        UTIL_TestDataFactory.createRecord(new LiveChatTranscript(CaseId = casy.Id));
    }

    @isTest
    static void testStoreConversation() {
        // Test data
        String chatId = '1234';
        String jsonConversation = '[{ "timestamp": "1616098900", "message": "message 1" }, { "timestamp": "1616098905", "message": "message 2" }]';
        LiveChatTranscript chatTranscript = [SELECT Id FROM LiveChatTranscript LIMIT 1];
        Thread__c chatThread = new Thread__c(); // Populate chatThread as required
        chatThread.CRM_Latest_Message_Datetime__c = Datetime.newInstance(2021, 3, 18, 10, 1, 15);

        Test.startTest();
        try {
            NKS_ChatTranscriptService.storeConversation(chatId, jsonConversation);
        } catch (Exception e) {
        }
        Test.stopTest();
    }

    @isTest
    static void testGetChatTranscript() {
        LiveChatTranscript lct = [SELECT Id FROM LiveChatTranscript LIMIT 1];
        Test.startTest();
        LiveChatTranscript result = NKS_ChatTranscriptService.getChatTranscript(lct.Id);
        Test.stopTest();
    }

    @isTest
    static void testCompareTo() {
        NKS_ChatTranscriptService.Message message1 = new NKS_ChatTranscriptService.Message();
        message1.timestamp = '1644152375';
        NKS_ChatTranscriptService.Message message2 = new NKS_ChatTranscriptService.Message();
        message2.timestamp = '1644153375';
        System.assertEquals(-1, message1.compareTo(message2));
        System.assertEquals(1, message2.compareTo(message1));
        System.assertEquals(0, message1.compareTo(message1));
    }

    @isTest
    static void testGetTransfertext() {
        NKS_ChatTranscriptService.Message message = new NKS_ChatTranscriptService.Message();
        message.name = 'John';
        message.language = 'en_US';
        System.assertEquals('Transferred to John', message.getTransfertext());
        message.language = 'no_NB';
        System.assertEquals('Overført til John', message.getTransfertext());
    }

    @isTest
    static void testGetThreadMessageType() {
        NKS_ChatTranscriptService.Message message = new NKS_ChatTranscriptService.Message();
        message.type = 'Agent';
        System.assertEquals('Message', message.getThreadMessageType());
        message.type = 'OperatorTransferred';
        System.assertEquals('Event', message.getThreadMessageType());
        message.type = 'operator transferred';
        System.assertEquals('Message', message.getThreadMessageType());
    }

    @isTest
    static void testIsAgentMessage() {
        NKS_ChatTranscriptService.Message message = new NKS_ChatTranscriptService.Message();
        message.type = 'agent';
        System.assertEquals(true, message.isAgentMessage());
        message.type = 'user';
        System.assertEquals(false, message.isAgentMessage());
        message.type = 'AGENT';
        System.assertEquals(true, message.isAgentMessage());
    }
}
