public class NKS_ConversationEntryService {
    private static final String API_VERSION = 'v61.0';
    private static LoggerUtility logger = new LoggerUtility('Messaging');
    private static Map<String, User> navIdentUserMap {
        get {
            if (navIdentUserMap == null) {
                navIdentUserMap = new Map<String, User>();
                for (User usr : [
                    SELECT Id, CRM_NAV_Ident__c, Department
                    FROM User
                    WHERE
                        Id IN (
                            SELECT AssigneeId
                            FROM PermissionSetAssignment
                            WHERE PermissionSetGroup.DeveloperName = 'Kontaktsenter'
                        )
                        AND IsActive = TRUE
                        AND CRM_NAV_Ident__c != NULL
                        AND CRM_NAV_Ident__c != ''
                ]) {
                    navIdentUserMap.put(usr.CRM_NAV_Ident__c, usr);
                }
            }
            return navIdentUserMap;
        }
        private set {
        }
    }
    
    public static Map<String, String> getConversationEntryMessages(List<MessagingSession> messagingSessions, Long startTimestamp, Long endTimestamp, String queryDirection, Integer recordLimit) {       
        Set<Id> conversationIds = new Set<Id>();
        for (MessagingSession session : messagingSessions) {
            conversationIds.add(session.ConversationId);
        }
        
        List<Conversation> conversations = [SELECT Id, ConversationIdentifier FROM Conversation WHERE Id IN :conversationIds];
        Map<Id, String> conversationIdentifierByConversationId = new Map<Id, String>();
        for (Conversation convo : conversations) {
            conversationIdentifierByConversationId.put(convo.Id, convo.ConversationIdentifier);
        }

        Map<String, String> conversationIdentifierByMessagingSessionId = new Map<String, String>();
        for (MessagingSession session : messagingSessions) {
            if (conversationIdentifierByConversationId.containsKey(session.ConversationId)) {
                conversationIdentifierByMessagingSessionId.put(session.Id, conversationIdentifierByConversationId.get(session.ConversationId));
            }
        }

        Map<String, String> responses = new Map<String, String>();
        for (MessagingSession msgSession : messagingSessions) {
            String conversationIdentifier = conversationIdentifierByMessagingSessionId.get(msgSession.Id);
            if (conversationIdentifier == null) {
                continue;
            }
        
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
            

            // TODO: Use ApiController
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
                    ConversationEntryWrapper wrapper = (ConversationEntryWrapper) JSON.deserialize(res.getBody(), ConversationEntryWrapper.class);     
                    System.debug('wrapper: ' + wrapper);         
                    createThreadWithMessages(wrapper, msgSession);

                    responses.put(msgSession.Id, res.getBody());
                } else {
                    logger.httpError('Failed to get conversation entries. Status Code: ' + res.getStatusCode(),
                    res, null, CRM_ApplicationDomain.Domain.NKS);
                }
            } catch (Exception e) {
                logger.exception(e, CRM_ApplicationDomain.Domain.NKS);
            } finally {
                logger.publish();
            }
        }
        // TODO: Remove
        return responses;
    }

    private static void createThreadWithMessages(ConversationEntryWrapper conversationEntryWrapper, MessagingSession messagingSession) {
        List<Message__c> messagesToInsert = new List<Message__c>();
        Id messagingSessionId = (Id) conversationEntryWrapper.conversationEntries[0].relatedRecords[0];
        Thread__c thread;

        for (ConversationEntry entry : conversationEntryWrapper.conversationEntries) {
            thread = new Thread__c();
            thread.CRM_Related_Object__c = messagingSessionId;
            thread.CRM_Account__c = messagingSession.EndUserAccountId;
            thread.CRM_Contact__c = messagingSession.EndUserContactId;
        }

        if (thread != null) {
            try {
                insert thread;
            } catch (Exception e) {
                logger.error('Error saving thread from chat: ' + e.getMessage(), null, CRM_ApplicationDomain.Domain.NKS);
            } finally {
                logger.publish();
            }
        }

        for (ConversationEntry entry : conversationEntryWrapper.conversationEntries) {
            String messageText = (String) entry.messageText;
            if (messageText != null) {
                Message__c message = new Message__c();
                message.CRM_Thread__c = thread.Id; 
                message.CRM_Message_Text__c = messageText;
                //message.CRM_Type__c = // TODO: Need type from Boost API?
                message.CRM_Sent_Date__c = DateTime.newInstance(entry.serverReceivedTimestamp);
                message.CRM_Read__c = false;
                if (entry.sender.role == 'Agent') { 
                    // TODO: Set this based on navIdentUserMap. Need more data on sender from Boost though
                    //message.CRM_From_User__c
                    //message.CRM_From_NAV_Unit__c
                } else {
                    message.CRM_From_Contact__c = messagingSession.EndUserContactId;
                }
                messagesToInsert.add(message);
            }
        }
        
        if (!messagesToInsert.isEmpty()) {
            try {
                insert messagesToInsert;
            } catch (Exception e) {
                logger.error('Error saving messages from chat: ' + e.getMessage(), null, CRM_ApplicationDomain.Domain.NKS);
            } finally {
                logger.publish();
            }
        }
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