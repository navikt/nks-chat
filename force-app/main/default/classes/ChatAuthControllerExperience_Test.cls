@IsTest
public class ChatAuthControllerExperience_Test {
    @TestSetup
    static void makeData() {
        User thisUser = [ SELECT Id FROM User WHERE Id = :UserInfo.getUserId()];

        System.runAs (thisUser) {
            MessagingChannel geirArne = (MessagingChannel) UTIL_TestDataFactory.createRecord(new MessagingChannel());
            UTIL_TestDataFactory.createRecord(new MessagingSession(MessagingChannelId = geirArne.Id, MessagingEndUserId = UTIL_TestDataFactory.createRecord(new MessagingEndUser(MessagingChannelId = geirArne.Id)).Id));
        }
    }

    @isTest
    static void testSetStatusCompleted() {
        MessagingSession messagingSession = [SELECT Id FROM MessagingSession LIMIT 1];

        Test.startTest();
        ChatAuthControllerExperience.setStatusCompleted(messagingSession.Id);
        Test.stopTest();

        MessagingSession updatedSession = [
            SELECT Id, CRM_Authentication_Status__c
            FROM MessagingSession
            WHERE Id = :messagingSession.Id
        ];
        System.assertEquals('Completed', updatedSession.CRM_Authentication_Status__c);
    }

    @isTest
    static void testGetCommunityAuthUrl() {
        String communityUrl;

        Test.startTest();
        communityUrl = ChatAuthControllerExperience.getCommunityAuthUrl();
        Test.stopTest();

        System.assert(String.isNotBlank(communityUrl));
    }

}