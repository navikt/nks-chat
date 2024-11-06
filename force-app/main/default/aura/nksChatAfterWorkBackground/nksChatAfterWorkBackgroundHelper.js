({
    convertId15To18: function (Id) {
        if (Id.length === 15) {
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
        if (index === -1) return;
        const recordId = tabs[index].recordId;
        tabs.splice(index, 1);
        component.set('v.closedChatList', tabs);
        this.removeThreatReport(component, recordId);
    },

    startTimer: function (component) {
        const tabs = component.get('v.closedChatList');
        if (tabs == null || tabs.length === 0) return;
        var appEvent = $A.get('e.c:afterworkEvent');
        appEvent.setParams({ tabId: tabs[0].tab });
        appEvent.setParams({ recordId: tabs[0].recordId });
        appEvent.setParams({ type: 'startTimer' });
        appEvent.fire();
    },

    storeThreatReport: function (component, reportingId, recordId) {
        let threatReportList = component.get('v.threatReportList');
        threatReportList.push({ reportingId: reportingId, recordId: recordId, time: Date.now() });
        component.set('v.threatReportList', threatReportList);
    },

    removeThreatReport: function (component, recordId) {
        const threatReports = component.get('v.threatReportList');
        const index = threatReports.findIndex((reporting) => reporting.recordId === recordId);
        if (index === -1) return;
        const reportingId = threatReports[index].reportingId;
        const time = Date.now() - threatReports[index].time;
        threatReports.splice(index, 1);
        component.set('v.threatReportList', threatReports);
        this.updateThreatTime(component, reportingId, time);
    },

    updateThreatTime: function (component, reportingId, time) {
        var action = component.get('c.updateThreatClickValue');
        action.setParams({ rDataId: reportingId, value: time });
        $A.enqueueAction(action);
    },

    handleChatEnded: function (component, event) {
        const eventRecordId = event.data.payload.MessagingSessionId__c;
        const workspace = component.find('workspace');
        const eventFullID = this.convertId15To18(eventRecordId);

        workspace
            .getAllTabInfo()
            .then((res) => {
                const eventTab = res.find((content) => content.recordId === eventFullID);
                if (!eventTab) return;
                this.storeClosedChatTabId(component, eventTab.tabId, eventFullID);
                this.startTimer(component);
            })
            .catch((error) => {
                console.error('Error closing tab:', error);
            });
    }
});
