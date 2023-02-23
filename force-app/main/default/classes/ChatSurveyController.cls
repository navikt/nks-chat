public with sharing class NKS_SurveyController {
    @AuraEnabled
    public static String createSurveyInvitation(String caseId) {
        String communityId;
        String surveyId;
        String surveyUrl;

        communityId = [SELECT Id FROM Network WHERE Name = 'TilbakemeldingAura'].Id;
        surveyId = [SELECT Id FROM Survey WHERE Name = 'nks_service_survey'].Id;

        try {
            List<SurveyInvitation> surveyInvitations = [SELECT id FROM SurveyInvitation WHERE Case__c = :caseId];
            if (surveyInvitations.size() > 0) {
                throw new SurveyException('Survey for this case is already completed.');
            }
            // Send survey to random users
            Integer randNum = (Math.random() * 100).intValue();
            if (randNum <= 40) {
                throw new SurveyException('This user does not visit the condition for sending survey.');
            }

            SurveyInvitation si = new SurveyInvitation();
            si.CommunityId = communityId;
            si.Name = caseId;
            si.Case__c = caseId;
            //si.ParticipantId = userInfo.getUserId();
            si.OptionsAllowGuestUserResponse = true;
            si.OptionsCollectAnonymousResponse = true;
            si.SurveyId = surveyId;
            insert si;

            SurveySubject ss = new SurveySubject();
            ss.SubjectId = caseId;
            ss.ParentId = si.Id;
            ss.Name = caseId;
            insert ss;

            SurveyInvitation sInv = [SELECT Id, UUID FROM SurveyInvitation WHERE Id = :si.Id];
            string uniqueSInvId = sInv.UUID;
            surveyUrl =
                getBaseURL() +
                'survey/runtimeApp.app?invitationId=' +
                sInv.id +
                '&surveyName=nks_service_survey&UUID=' +
                uniqueSInvId;
            system.debug('survey url' + json.serialize(surveyURL));
            return surveyUrl;
        } catch (exception ex) {
            System.debug('The following exception has occurred while inserting SurveySubject: ' + ex.getMessage());
            surveyUrl = ex.getMessage();
            return surveyUrl;
        } finally {
            return surveyUrl;
        }
    }

    private static String getBaseURL() {
        Site site = [SELECT Id FROM Site WHERE Name = 'TilbakemeldingAura' LIMIT 1];
        String communityUrl = [SELECT SecureURL FROM SiteDetail WHERE DurableId = :site.Id].SecureUrl;
        //List<String> urls = new List<String>();
        //urls.add(communityUrl);
        System.debug('Community url: ' + communityUrl);
        return communityUrl;
    }

    public class SurveyException extends Exception {
    }
}
