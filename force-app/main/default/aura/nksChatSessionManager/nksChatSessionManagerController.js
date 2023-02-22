({
    onAgentSend: function (cmp, evt, helper) {
        var content = evt.getParam('content');
        var type = evt.getParam('type');

        if (content.toLowerCase().includes('mvh') && type === 'Agent') {
            var recordId = cmp.get('v.recordId');
            var sessionIdShort =
                recordId != null && recordId != '' && recordId.length > 15 ? recordId.substring(0, 15) : recordId;
            helper.sendMessage(cmp, evt, sessionIdShort);
        }
    }
});
