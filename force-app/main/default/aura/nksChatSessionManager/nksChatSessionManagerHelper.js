({
    sendMessage: function (cmp, sessionIdShort, message) {
        var conversationKit = cmp.find('conversationKit');
        if (sessionIdShort != null && sessionIdShort != '') {
            conversationKit
                .sendMessage({
                    recordId: sessionIdShort,
                    message: {
                        text: message
                    }
                })
                .then(function (result) {
                    if (result) {
                        console.log('Successfully sent message: ' + message);
                    } else {
                        console.log('Failed to send message!');
                    }
                });
        }
    }
});
