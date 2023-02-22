({
    sendMessage: function (cmp, evt, sessionIdShort) {
        if (sessionIdShort != null && sessionIdShort != '') {
            var conversationKit = cmp.find('conversationKit');
            var action = cmp.get('c.createSurveyInvitation');
            console.log(cmp.get('v.record.CaseId'));
            action.setParam({ caseId: cmp.get('v.record.CaseId') });
            action.setCallback(this, function (response) {
                var state = response.getState();
                if (state === 'SUCCESS') {
                    conversationKit
                        .sendMessage({
                            recordId: sessionIdShort,
                            message: {
                                text: response.getReturnValue()
                            }
                        })
                        .then(function (result) {
                            if (result) {
                                console.log('Successfully sent message!');
                            } else {
                                console.log('Failed to send message!');
                            }
                        });
                } else {
                    console.log('Problem getting Survey link: ' + response.getReturnValue());
                }
            });
            $A.enqueueAction(action);
        }
    }
});
