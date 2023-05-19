@isTest
public with sharing class Chat_SurveyHelperTest {
    @isTest
    static void testGetSurveyLink() {
        Case enCase = new Case(Status = 'New');
        LiveChatTranscript transcript = new LiveChatTranscript(
            ChatKey = 'testKey',
            CaseId = enCase.Id,
            CRM_Authentication_Status__c = 'Completed',
            NKS_Authentication_Timestamp__c = Datetime.now()
        );
        String surveyLink = '';

        Test.startTest();
        try {
            surveyLink = Chat_SurveyHelper.getSurveyLink('testKey');
        } catch (Exception e) {
        }
        Test.stopTest();
        System.assertEquals('', surveyLink);
    }
}
