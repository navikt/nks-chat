public class NKS_ConversationEntryController {
    private static LoggerUtility logger = new LoggerUtility('Messaging');
    private static Map<String, User> navIdentUserMap = getNavIdentUserMap();

    public static void convertConversationEntries(
        List<MessagingSession> messagingSessions,
        Long startTimestamp,
        Long endTimestamp,
        String queryDirection,
        Integer recordLimit
    ) {
        Set<Id> conversationIds = new Set<Id>();
        for (MessagingSession session : messagingSessions) {
            conversationIds.add(session.ConversationId);
        }

        Map<String, String> conversationIdentifierByMessagingSessionId = getConversationIdentifierByMessagingSessionIdMap(
            messagingSessions,
            conversationIds
        );
        for (MessagingSession session : messagingSessions) {
            String conversationIdentifier = conversationIdentifierByMessagingSessionId.get(session.Id);
            if (conversationIdentifier == null) {
                continue;
            }

            try {
                NKS_ConversationEntryService.ConversationEntryWrapper wrapper = NKS_ConversationEntryService.getConversationEntryMessages(
                    conversationIdentifier,
                    startTimestamp,
                    endTimestamp,
                    queryDirection,
                    recordLimit
                );
                //createThreadWithMessages(wrapper, session);
            } catch (Exception e) {
                logger.exception(e, CRM_ApplicationDomain.Domain.NKS);
            } finally {
                logger.publish();
            }
        }
    }

    private static Map<Id, String> getConversationIdentifierMap(Set<Id> conversationIds) {
        Map<Id, String> conversationIdentifierByConversationId = new Map<Id, String>();
        List<Conversation> conversations = [
            SELECT Id, ConversationIdentifier
            FROM Conversation
            WHERE Id IN :conversationIds
        ];
        for (Conversation convo : conversations) {
            conversationIdentifierByConversationId.put(convo.Id, convo.ConversationIdentifier);
        }

        return conversationIdentifierByConversationId;
    }

    private static Map<String, String> getConversationIdentifierByMessagingSessionIdMap(
        List<MessagingSession> messagingSessions,
        Set<Id> conversationIds
    ) {
        Map<Id, String> conversationIdentifierByConversationId = getConversationIdentifierMap(conversationIds);
        Map<String, String> conversationIdentifierByMessagingSessionId = new Map<String, String>();

        for (MessagingSession session : messagingSessions) {
            if (conversationIdentifierByConversationId.containsKey(session.ConversationId)) {
                conversationIdentifierByMessagingSessionId.put(
                    session.Id,
                    conversationIdentifierByConversationId.get(session.ConversationId)
                );
            }
        }

        return conversationIdentifierByMessagingSessionId;
    }

    private static void createThreadWithMessages(
        NKS_ConversationEntryService.ConversationEntryWrapper wrapper,
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
        for (NKS_ConversationEntryService.ConversationEntry entry : wrapper.conversationEntries) {
            if (entry.messageText != null) {
                Message__c message = new Message__c();
                message.CRM_Thread__c = thread.Id;
                message.CRM_Message_Text__c = entry.messageText;
                message.CRM_Sent_Date__c = DateTime.newInstance(entry.serverReceivedTimestamp);
                message.CRM_Read__c = false;
                //message.CRM_Type__c = // TODO: Need type from Boost
                if (entry.sender.role == 'Agent') {
                    // TODO: Set this based on navIdentUserMap. Need more data on sender from Boost though
                    //message.CRM_From_User__c
                    //message.CRM_From_NAV_Unit__c
                } else {
                    message.CRM_From_Contact__c = session.EndUserContactId;
                }
                messagesToInsert.add(message);
            }
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

    private static Map<String, User> getNavIdentUserMap() {
        Map<String, User> navIdentUsermap = new Map<String, User>();
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
            navIdentUsermap.put(usr.CRM_NAV_Ident__c, usr);
        }

        return navIdentUsermap;
    }
}
