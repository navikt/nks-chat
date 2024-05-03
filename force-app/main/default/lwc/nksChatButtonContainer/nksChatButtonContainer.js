import { LightningElement, api } from 'lwc';
import CREATE_NAV_TASK_LABEL from '@salesforce/label/c.NKS_Create_NAV_Task';
import JOURNAL_LABEL from '@salesforce/label/c.NKS_Journal';
import SEND_TO_REDACTION_LABEL from '@salesforce/label/c.NKS_Set_To_Redaction';
import { publishToAmplitude } from 'c/amplitude';

export default class ChatButtonContainer extends LightningElement {
    @api recordId;

    showFlow = false;
    labels = {
        sendToRedaction: SEND_TO_REDACTION_LABEL,
        createNavTask: CREATE_NAV_TASK_LABEL,
        journal: JOURNAL_LABEL
    };
    label;

    get inputVariables() {
        return [
            {
                name: 'recordId',
                type: 'String',
                value: this.recordId
            }
        ];
    }

    get showRedact() {
        return this.showFlow && this.label === this.labels.sendToRedaction;
    }

    get showCreateNavTask() {
        return this.showFlow && this.label === this.labels.createNavTask;
    }

    get showJournal() {
        return this.showFlow && this.label === this.labels.journal;
    }

    toggleFlow(event) {
        this.showFlow = !this.showFlow;
        this.label = event.target.label;
        publishToAmplitude('Chat', { type: this.label + ' pressed' });
    }

    handleStatusChange(event) {
        let flowStatus = event.detail.status;
        if (flowStatus === 'FINISHED' || flowStatus === 'FINISHED_SCREEN') {
            this.showFlow = false;
        }
    }
}
