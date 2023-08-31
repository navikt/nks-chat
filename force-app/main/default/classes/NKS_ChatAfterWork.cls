public with sharing class NKS_ChatAfterWork {
    @AuraEnabled
    public static Boolean hasBetaAccess() {
        return FeatureManagement.checkPermission('NKS_Beta');
    }
}
