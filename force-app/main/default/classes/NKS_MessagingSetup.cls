public with sharing class NKS_MessagingSetup {
    public final static String messagingLicenseDeveloperName = 'EmbeddedServiceMessagingUserPsl';
    public final static String messagingPermissionSetName = 'NKS_Messaging_Permissions';

    public static List<User> getUsersWithSkillGroup() {
        return [
            SELECT Id
            FROM User
            WHERE Id IN (SELECT UserOrGroupId FROM GroupMember WHERE Group.DeveloperName LIKE 'NKS_Skill_%')
        ];
    }

    public static void addMessagingPermissions(List<User> users) {
        LoggerUtility logger = new LoggerUtility('Messaging');
        PermissionSetLicense messagingLicense = [
            SELECT DeveloperName, TotalLicenses, UsedLicenses, Id
            FROM PermissionSetLicense
            WHERE DeveloperName = :messagingLicenseDeveloperName
            LIMIT 1
        ];
        if (messagingLicense == null)
            return;
        List<PermissionSetLicenseAssign> assignedPermissionLicenses = new List<PermissionSetLicenseAssign>();
        if (messagingLicense.TotalLicenses > messagingLicense.UsedLicenses + users.size()) {
            for (User user : users) {
                PermissionSetLicenseAssign permission = new PermissionSetLicenseAssign();
                permission.AssigneeId = user.Id;
                permission.PermissionSetLicenseId = messagingLicense.Id;
                assignedPermissionLicenses.add(permission);
            }
        } else {
            logger.error(
                'Could not assign messagingLicense ' +
                    messagingLicense.DeveloperName +
                    ' to ' +
                    users.size() +
                    ' users, as there were only ' +
                    (messagingLicense.TotalLicenses - messagingLicense.UsedLicenses) +
                    ' left.',
                messagingLicense,
                CRM_ApplicationDomain.Domain.NKS
            );
            return;
        }
        insert assignedPermissionLicenses;

        List<PermissionSetAssignment> assignedPermissions = new List<PermissionSetAssignment>();
        PermissionSet messagingPermission = [
            SELECT Id, Name
            FROM PermissionSet
            WHERE Name = :messagingPermissionSetName
            LIMIT 1
        ];

        for (User user : users) {
            PermissionSetAssignment permissioner = new PermissionSetAssignment();
            permissioner.AssigneeId = user.Id;
            permissioner.PermissionSetId = messagingPermission.Id;
            assignedPermissions.add(permissioner);
        }
        insert assignedPermissions;
    }

    public static void removeMessagingPermissions(List<User> users) {
        List<Id> userIds = new List<Id>();
        for (User user : users) {
            userIds.add(user.Id);
        }
        delete [
            SELECT Id
            FROM PermissionSetAssignment
            WHERE PermissionSet.Name = :messagingPermissionSetName AND AssigneeId IN :userIds
        ];
        delete [
            SELECT Id
            FROM PermissionSetLicenseAssign
            WHERE PermissionSetLicense.DeveloperName = :messagingLicenseDeveloperName AND AssigneeId IN :userIds
        ];
    }
}
