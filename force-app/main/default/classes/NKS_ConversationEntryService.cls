public class NKS_ConversationEntryService {
    private static final String API_VERSION = 'v61.0';
    private static LoggerUtility logger = new LoggerUtility('Messaging');

    public static ConversationEntryWrapper getConversationEntryMessages(
        String conversationIdentifier,
        Long startTimestamp,
        Long endTimestamp,
        String queryDirection,
        Integer recordLimit
    ) {
        String url = buildUrl(conversationIdentifier, startTimestamp, endTimestamp, queryDirection, recordLimit);

        HttpRequest req = new HttpRequest();
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
    }

    public class ConversationEntryWrapper {
        public List<ConversationEntry> conversationEntries;
    }

    public class ConversationEntry {
        public Integer clientDuration;
        public Long clientTimestamp;
        public String identifier;
        public String messageText;
        public List<String> relatedRecords;
        public Sender sender;
        public Long serverReceivedTimestamp;
    }

    public class Sender {
        public String appType;
        public String role;
        public String subject;
    }
}
