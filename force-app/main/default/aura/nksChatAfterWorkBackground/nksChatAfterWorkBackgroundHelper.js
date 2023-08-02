({
    convertId15To18: function (Id) {
        if (Id.length == 15) {
            var addon = '';
            for (var block = 0; block < 3; block++) {
                var loop = 0;
                for (var position = 0; position < 5; position++) {
                    var current = Id.charAt(block * 5 + position);
                    if (current >= 'A' && current <= 'Z') loop += 1 << position;
                }
                addon += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ012345'.charAt(loop);
            }
            return Id + addon;
        }
        return Id;
    },

    storeClosedChatTabId: function (component, tabId, recordId) {
        const tabs = component.get('v.closedChatList');
        tabs.push({ tab: tabId, recordId: recordId });
        component.set('v.closedChatList', tabs);
    },

    removeClosedChatTabId: function (component, tabId) {
        const tabs = component.get('v.closedChatList');
        const index = tabs.findIndex((tab) => tab.tab === tabId);
        if (index > -1) {
            tabs.splice(index, 1);
            component.set('v.closedChatList', tabs);
        }
    },

    startTimer: function (component) {
        const tabs = component.get('v.closedChatList');
        if (tabs == null || tabs.length === 0) return;
        var appEvent = $A.get('e.c:afterworkEvent');
        appEvent.setParams({ tabId: tabs[0].tab });
        appEvent.setParams({ recordId: tabs[0].recordId });
        appEvent.fire();
    }
});
