public class NKS_ConversationEntryService {
    //private static final String API_VERSION = 'v61.0';
    //private static LoggerUtility logger = new LoggerUtility('Messaging');
    private static final String API_CONFIG_NAME = 'CONVERSATION_ENTRY_CONNECT_REST_API';
    private static final String SERVICE_NAME = 'GET_CONVERSATION_ENTRIES';

    public static HttpResponse getConversationEntryMessages(
        String conversationIdentifier,
        Long startTimestamp,
        Long endTimestamp,
        String queryDirection,
        Integer recordLimit
    ) {
        //String url = buildUrl(conversationIdentifier, startTimestamp, endTimestamp, queryDirection, recordLimit);
        Map<String, String> pathParams = new Map<String, String>{ 'conversationIdentifier' => conversationIdentifier };
        ApiController apiCtrl = new ApiController();
        apiCtrl.initRequest(API_CONFIG_NAME, SERVICE_NAME, pathParams);
        apiCtrl.addServiceAuthHeader(SERVICE_AUTH_HEADER);
        apiCtrl.addHeader('Content-Type', 'application/json');
        apiCtrl.doCallout();
        System.debug('response: ' + apiCtrl.getResponse());
        return apiCtrl.getResponse();
    }


        /*HttpRequest req = new HttpRequest();
        req.setEndpoint(System.URL.getOrgDomainUrl().toExternalForm() + url);
        req.setMethod('GET');
        req.setHeader('Authorization', 'Bearer ' + UserInfo.getSessionId());
        req.setHeader('Content-Type', 'application/json');

        Http http = new Http();
        HttpResponse res;
        try {
            res = http.send(req);
            if (res.getStatusCode() == 200) {
                return (ConversationEntryWrapper) JSON.deserialize(res.getBody(), ConversationEntryWrapper.class);
            } else {
                logger.httpError(
                    'Failed to get conversation entries. Status Code: ' + res.getStatusCode(),
                    res,
                    null,
                    CRM_ApplicationDomain.Domain.NKS
                );
                return null;
            }
        } catch (Exception e) {
            logger.exception(e, CRM_ApplicationDomain.Domain.NKS);
            return null;
        } finally {
            logger.publish();
        }
    }

    private static String buildUrl(
        String conversationIdentifier,
        Long startTimestamp,
        Long endTimestamp,
        String queryDirection,
        Integer recordLimit
    ) {
        String url = '/services/data/' + API_VERSION + '/connect/conversation/' + conversationIdentifier + '/entries?';

        if (startTimestamp != null) {
            url += 'startTimestamp=' + startTimestamp + '&';
        }
        if (endTimestamp != null) {
            url += 'endTimestamp=' + endTimestamp + '&';
        }
        if (queryDirection != null && (queryDirection == 'FromEnd' || queryDirection == 'FromStart')) {
            url += 'queryDirection=' + queryDirection + '&';
        }
        if (recordLimit != null && recordLimit > 0 && recordLimit <= 1000) {
            url += 'recordLimit=' + recordLimit;
        }
        if (url.endsWith('&') || url.endsWith('?')) {
            url = url.substring(0, url.length() - 1);
        }

        return url;
    }*/
}
