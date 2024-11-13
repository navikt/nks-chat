public class NKS_ConversationEntryController {
    private static LoggerUtility logger = new LoggerUtility('Messaging');
    private static Map<String, User> navUserInfoByUserId = getNavUserInfoByUserId();

    public static void convertConversationEntries(
        List<MessagingSession> msgSessions,
        Long startTimestamp,
        Long endTimestamp,
        String queryDirection,
        Integer recordLimit
    ) {
        List<Id> messagingSessionIds = new List<Id>();
        for (MessagingSession msgSession : msgSessions) {
            messagingSessionIds.add(msgSession.Id);
        }
        List<MessagingSession> messagingSessions = [
            SELECT Id, Conversation.ConversationIdentifier, Endtime, Status, EndUserAccountId, EndUserContactId
            FROM MessagingSession
            WHERE Id IN :messagingSessionIds
        ];

        for (MessagingSession session : messagingSessions) {
            String conversationIdentifier = session.Conversation.ConversationIdentifier;
            if (conversationIdentifier == null) {
                continue;
            }

            HttpResponse response;
            try {
                response = NKS_ConversationEntryService.getConversationEntryMessages(
                    conversationIdentifier,
                    startTimestamp,
                    endTimestamp,
                    queryDirection,
                    recordLimit
                );

                logger.info('MessagingSession response' + response, null, CRM_ApplicationDomain.Domain.NKS);
                logger.publish();
                System.debug('response: ' + response);
                if (response.getStatusCode() == 200) {
                    ConversationEntryWrapper wrapper = (ConversationEntryWrapper) JSON.deserialize(
                        response.getBody(),
                        ConversationEntryWrapper.class
                    );
                    System.debug('wrapper: ' + wrapper);
                    //createThreadWithMessages(wrapper, session);
                } else {
                    logger.httpError(
                        'Failed to get conversation entries. Status Code: ' + response.getStatusCode(),
                        response,
                        null,
                        CRM_ApplicationDomain.Domain.NKS
                    );
                    return;
                }
            } catch (Exception e) {
                logger.exception(e, CRM_ApplicationDomain.Domain.NKS);
                return;
            } finally {
                logger.publish();
            }
        }
    }

    private static void createThreadWithMessages(
        ConversationEntryWrapper wrapper,
        MessagingSession session
    ) {
        if (wrapper == null || wrapper.conversationEntries == null || wrapper.conversationEntries.isEmpty()) {
            return;
        }

        Id messagingSessionId = (Id) wrapper.conversationEntries[0].relatedRecords[0];
        Thread__c thread = new Thread__c();
        thread.CRM_Related_Object__c = messagingSessionId;
        thread.CRM_Account__c = session.EndUserAccountId;
        thread.CRM_Contact__c = session.EndUserContactId;

        try {
            insert thread;
        } catch (Exception e) {
            logger.error('Error saving thread: ' + e.getMessage(), null, CRM_ApplicationDomain.Domain.NKS);
        } finally {
            logger.publish();
        }

        List<Message__c> messagesToInsert = new List<Message__c>();
        // TODO: Find a way to separate chat bot messages from user messages and add them before auth message
        messagesToInsert.add(createAuthEventMessage(session, thread));

        for (ConversationEntry entry : wrapper.conversationEntries) {
            if (entry.messageText == null) {
                continue;
            }
            Message__c message = new Message__c();
            message.CRM_Thread__c = thread.Id;
            message.CRM_Message_Text__c = entry.messageText;
            message.CRM_Sent_Date__c = DateTime.newInstance(entry.serverReceivedTimestamp);
            message.CRM_Read__c = false;
            message.CRM_Type__c = 'Message';
            if (entry.sender.role == 'Agent') {
                message.CRM_From_User__c = navUserInfoByUserId.get(entry.sender.subject).Id;
                message.CRM_From_NAV_Unit__c = navUserInfoByUserId.get(entry.sender.subject).Department;
            } else {
                message.CRM_From_Contact__c = session.EndUserContactId;
            }
            messagesToInsert.add(message);
        }

        if (!messagesToInsert.isEmpty()) {
            try {
                insert messagesToInsert;
            } catch (Exception e) {
                logger.error('Error saving messages: ' + e.getMessage(), null, CRM_ApplicationDomain.Domain.NKS);
            } finally {
                logger.publish();
            }
        }
    }

    private static Message__c createAuthEventMessage(MessagingSession msgSession, Thread__c chatThread) {
        String authText = 'Startet innlogget chat'; // TODO: How will EndUserLanguage be set?
        /*String authText = msgSession.EndUserLanguage == 'en'
            ? 'Started authenticated chat'
            : 'Startet innlogget chat';*/
        return new Message__c(
            CRM_Thread__c = chatThread.Id,
            CRM_Type__c = 'Event',
            //CRM_Sent_date__c = chatTrans.NKS_Authentication_Timestamp__c, // TODO: Add this custom field and set it when auth is complete
            CRM_Read__c = false,
            CRM_Message_Text__c = authText
        );
    }

    private static Map<String, User> getNavUserInfoByUserId() {
        Map<String, User> navUserInfoByUserId = new Map<String, User>();
        for (User usr : [
            SELECT Id, Department
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
            navUserInfoByUserId.put(usr.Id, usr);
        }

        return navUserInfoByUserId;
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
