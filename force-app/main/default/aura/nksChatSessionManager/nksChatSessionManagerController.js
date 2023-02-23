({
    onAgentSend: function (cmp, evt, helper) {
        var content = evt.getParam('content');
        var type = evt.getParam('type');
        var message = 'Gi oss tilbakemlding ved å trykke på denne lenken:\n';
        if (content.toLowerCase().includes('mvh') && type === 'Agent') {
            try {
                var action = cmp.get('c.createSurveyInvitation');
                action.setParams({ caseId: cmp.get('v.record.CaseId') });
                action.setCallback(this, function (response) {
                    var state = response.getState();
                    console.log(response.getReturnValue());
                    if (state === 'SUCCESS' && response.getReturnValue().includes('https')) {
                        message += response.getReturnValue();
                        var recordId = cmp.get('v.recordId');
                        var sessionIdShort =
                            recordId != null && recordId != '' && recordId.length > 15
                                ? recordId.substring(0, 15)
                                : recordId;
                        helper.sendMessage(cmp, sessionIdShort, message);
                    } else if (state === 'ERROR') {
                        var errors = response.getError();
                        if (errors) {
                            if (errors[0] && errors[0].message) {
                                console.log('Error message: ' + errors[0].message);
                            }
                        } else {
                            console.log('Unknown error!');
                        }
                    }
                });
                $A.enqueueAction(action);
            } catch (error) {
                console.log('Problem getting Survey Link: ' + error);
            }
        }
    }
});
