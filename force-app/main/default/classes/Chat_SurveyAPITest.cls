@isTest
public with sharing class Chat_SurveyAPITest {
    @IsTest
    static void testGetSurveyInvitationLink() {
        /** 
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
        */

        RestRequest request = new RestRequest();
        RestResponse response = new RestResponse();
        request.requestURI = System.Url.getOrgDomainUrl() + '/api/getSurveyInvitationLink';
        request.httpMethod = 'GET';
        request.addParameter('ChatKey', '12345');
        RestContext.request = request;
        RestContext.response = response;

        Test.startTest();

        Chat_SurveyAPI.getSurveyInvitationLink();

        Test.stopTest();

        //String contentType = response.getHeader('Content-Type');
        //String responseBody = response.getBodyAsString();

        //Assert response status code
        System.assertEquals(200, response.statusCode);

        //Assert response content type
        // System.assertEquals('application/json', contentType);

        //Assert not null response body
        System.assert(response.responseBody != null);
    }
}
