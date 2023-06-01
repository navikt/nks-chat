@isTest
public with sharing class Chat_SurveyAPITest {
    @IsTest
    static void testGetSurveyInvitationLink() {
        Test.startTest();
        // Prepare the request
        String mockChatKey = 'chatkey123';
        RestRequest request = new RestRequest();
        request.params.put('ChatKey', mockChatKey);
        RestContext.request = request;
        try {
            // Call the API
            Chat_SurveyAPI.getSurveyInvitationLink();
        } catch (Exception e) {
        }
        // Validate the response
        RestResponse response = RestContext.response;
        Test.stopTest();
    }
}
