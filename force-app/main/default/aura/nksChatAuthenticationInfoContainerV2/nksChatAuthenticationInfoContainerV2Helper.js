({
    showLoginMsg: function (component, event) {
        const chatToolkit = component.find('chatToolkit');
        const recordId = component.get('v.recordId');
        const loginMsg = event.getParam('loginMessage');

        if (component.get('v.authCompletedHandled')) {
            chatToolkit
                .sendMessage({
                    recordId,
                    message: { text: loginMsg }
                })
                .then(() => {
                    console.log('Successfully sent login message to chat');
                })
                .catch((error) => {
                    console.error('Error sending login message:', error);
                });
        }
    },

    setTabIcon: function (component, tabId, iconName, iconAlt) {
        const workspace = component.find('workspace');

        workspace.setTabIcon({
            tabId,
            icon: iconName,
            iconAlt
        });
    },

    subscribeEmpApi: function (component) {
        const empApi = component.find('empApi');
        const channel = '/data/MessagingSessionChangeEvent';
        const replayId = -1;

        empApi
            .subscribe(
                channel,
                replayId,
                $A.getCallback((eventReceived) => {
                    this.handleEmpApiEvent(component, eventReceived);
                })
            )
            .then((subscription) => {
                component.set('v.subscription', subscription);
                console.log('Subscribed to channel:', channel);
            })
            .catch((error) => {
                console.error('Subscription error:', JSON.stringify(error));
            });
    },

    unsubscribeEmpApi: function (component) {
        const empApi = component.find('empApi');
        const subscription = component.get('v.subscription');

        if (subscription) {
            empApi
                .unsubscribe(
                    subscription,
                    $A.getCallback(() => {
                        component.set('v.subscription', null);
                        console.log('Unsubscribed from channel');
                    })
                )
                .catch((error) => {
                    console.error('Unsubscribe error:', JSON.stringify(error));
                });
        }
    },

    handleEmpApiEvent: function (component, eventReceived) {
        const recordId = component.get('v.recordId');
        const eventRecordIds = eventReceived.data.payload.ChangeEventHeader.recordIds;
        const changedFields = eventReceived.data.payload.ChangeEventHeader.changedFields;

        if (eventRecordIds.includes(recordId) && changedFields.includes('CRM_Authentication_Status__c')) {
            const authStatus = eventReceived.data.payload.CRM_Authentication_Status__c;

            component
                .find('workspace')
                .getEnclosingTabId()
                .then((tabId) => {
                    if (authStatus === 'Completed') {
                        this.setTabIcon(component, tabId, 'utility:lock', 'Innlogget chat');
                    } else {
                        this.setTabIcon(component, tabId, 'standard:live_chat', 'Uinnlogget chat');
                    }
                });
        }
    }
});
