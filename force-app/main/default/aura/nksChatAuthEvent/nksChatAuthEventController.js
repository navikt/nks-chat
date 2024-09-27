({
    handleChatEnded: function (component, event) {
        // publish event to chatMessageChannel
        var type = event.getParam('type');
        if (type === 'startTimer') {
            const eventRecordId = event.getParam('recordId');
            component.find('chatMessageChannel').publish({
                chatEnded: true,
                recordId: eventRecordId
            });
        }
    }
});
