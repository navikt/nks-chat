@isTest
public class ChatAuthController_Test {
    @TestSetup
    static void makeData() {
        Case casy = (Case) UTIL_TestDataFactory.createRecord(new Case());
        UTIL_TestDataFactory.createRecord(new LiveChatTranscript(CaseId = casy.Id));
    }

    @isTest
    static void testGetCounselorName() {
        String fullname;
        LiveChatTranscript chatTranscript = [SELECT Id FROM LiveChatTranscript LIMIT 1];

        Test.startTest();
        fullname = ChatAuthController.getCounselorName(chatTranscript.Id);
        Test.stopTest();

        System.assert(String.isNotBlank(fullname));
    }
}
