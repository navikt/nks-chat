import { LightningElement, api, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import MESSAGING_SESSION_STATUS from '@salesforce/schema/MessagingSession.Status';
import reportThreatClick from '@salesforce/apex/NKS_ChatAfterWork.reportThreatClick';
import { publish, MessageContext } from 'lightning/messageService';
import CHAT_EVENT_CHANNEL from '@salesforce/messageChannel/ChatEventChannel__c';

export default class ChatAfterWorkLWC extends LightningElement {
    @api recordId;

    timer = 150;
    maxTimer = 150;
    percentageTimer = 100;
    showTimer = false;
    stopped = false;
    intervalId;

    @wire(MessageContext)
    messageContext;

    @wire(getRecord, { recordId: '$recordId', fields: [MESSAGING_SESSION_STATUS] })
    messagingSession;

    get isChatEnded() {
        const status = getFieldValue(this.messagingSession.data, MESSAGING_SESSION_STATUS);
        return status === 'Ended';
    }

    renderedCallback() {
        if (this.isChatEnded && !this.showTimer) {
            this.startTimer();
        }
    }

    startTimer() {
        this.showTimer = true;
        this.maxTimer = this.timer;

        // eslint-disable-next-line @lwc/lwc/no-async-operation, @locker/locker/distorted-window-set-interval
        this.intervalId = setInterval(() => {
            if (this.stopped) clearInterval(this.intervalId);

            this.timer--;
            this.percentageTimer = (this.timer * 100) / this.maxTimer;

            if (this.timer <= 0) {
                clearInterval(this.intervalId);
                this.closeTab();
            }
        }, 1000);
    }

    stopTimer() {
        this.stopped = true;
        reportThreatClick()
            .then((result) => {
                console.log('Reporting data created: ', result);
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    }

    closeTab() {
        const message = {
            recordId: this.recordId,
            action: 'closeTab'
        };
        publish(this.messageContext, CHAT_EVENT_CHANNEL, message);
    }
}
