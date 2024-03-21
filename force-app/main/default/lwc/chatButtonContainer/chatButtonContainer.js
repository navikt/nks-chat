import { LightningElement, api } from 'lwc';
import CREATE_NAV_TASK_LABEL from '@salesforce/label/c.NKS_Create_NAV_Task';
import JOURNAL_LABEL from '@salesforce/label/c.NKS_Journal';
import SEND_TO_REDACTION_LABEL from '@salesforce/label/c.Set_To_Redaction';
import { publishToAmplitude } from 'c/amplitude';

export default class ChatButtonContainer extends LightningElement {
    @api recordId;

    showFlow = false;
    showRedact = false;
    showJournal = false;
    showCreateNavTask = false;
    redact = SEND_TO_REDACTION_LABEL;
    createNavTask = CREATE_NAV_TASK_LABEL;
    journal = JOURNAL_LABEL;
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

    toggleFlow(event) {
        this.showFlow = !this.showFlow;
        this.label = event.target.label;
        this.handleShowFlows();
        publishToAmplitude('Chat', { type: this.label + ' pressed' });
    }

    handleShowFlows() {
        if (this.label === this.redact) {
            this.showRedact = true;
            this.showJournal = false;
            this.showCreateNavTask = false;
        }

        if (this.label === this.createNavTask) {
            this.showCreateNavTask = true;
            this.showRedact = false;
            this.showJournal = false;
        }

        if (this.label === this.journal) {
            this.showJournal = true;
            this.showCreateNavTask = false;
            this.showRedact = false;
        }
    }

    handleStatusChange(event) {
        let flowStatus = event.detail.status;
        if (flowStatus === 'FINISHED' || flowStatus === 'FINISHED_SCREEN') {
            this.showFlow = false;
        }
    }
}
