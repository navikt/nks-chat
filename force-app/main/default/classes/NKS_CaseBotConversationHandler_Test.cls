@isTest
public class NKS_CaseBotConversationHandler_Test {
    @TestSetup
    static void makeData() {
        String botConversation = '22:15:14 - bot:\n';
        botConversation += 'Det er mange som vil snakke med oss nå. Hold chatten åpen og følg med, så svarer vi deg så snart vi kan.\n';
        botConversation += '22:15:14 - bot:\n';
        botConversation = 'Jeg setter deg over, et øyeblikk.\n';

        Case botCase = (Case) UTIL_TestDataFactory.createRecord(new Case(Description = botConversation));
    }

    @isTest
    static void testConversationFormat() {
        Case casy = [SELECT Id FROM Case LIMIT 1];
        LiveChatTranscript trans = (LiveChatTranscript) UTIL_TestDataFactory.createRecord(
            new LiveChatTranscript(CaseId = casy.Id)
        );

        Test.startTest();
        casy.SourceId = trans.Id;
        update casy;
        Test.stopTest();

        System.assertNotEquals(null, [SELECT Id, NKS_Conversation__c FROM Case LIMIT 1]?.NKS_Conversation__c);
    }
}
