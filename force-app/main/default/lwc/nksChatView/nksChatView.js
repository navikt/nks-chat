import { LightningElement, api, wire, track } from 'lwc';
import getThreadId from '@salesforce/apex/nksChatView.getThreadId';
import markasread from '@salesforce/apex/CRM_MessageHelper.markAsRead';
import getChatbotMessage from '@salesforce/apex/nksChatView.getChatbotMessage';
import { publish, MessageContext } from 'lightning/messageService';
import globalModalOpen from '@salesforce/messageChannel/globalModalOpen__c';
import userId from '@salesforce/user/Id';

///////////// Extra import
import getmessages from '@salesforce/apex/CRM_MessageHelper.getMessagesFromThread';
import getContactId from '@salesforce/apex/CRM_MessageHelper.getUserContactId';

export default class NksChatView extends LightningElement {
    @api recordId;
    threadId;
    errorList = { title: '', errors: [] };
    modalOpen = false;
    @track chatbotMessage = 'Laster inn samtale';

    @wire(MessageContext)
    messageContext;

    userContactId;
    messages;

    connectedCallback() {
        getContactId({})
            .then((contactId) => {
                this.userContactId = contactId;
            })
            .catch((error) => {
                //Apex error
            });
    }

    @wire(getThreadId, { chatId: '$recordId' })
    test({ error, data }) {
        if (error) {
            console.log(error);
        }
        if (data) {
            this.threadId = data;
            markasread({ threadId: this.threadId });
        }
    }

    handleValidation() {
        this.errorList = {
            title: '',
            errors: [{ Id: 1, EventItem: '', Text: 'Du kan ikke sende melding på en chat.' }]
        };
        this.createMessage(false);
    }

    createMessage(validation) {
        this.template.querySelector('c-crm-messaging-community-thread-viewer').createMessage(validation);
    }

    handleModalButton() {
        this.modalOpen = true;
        this.termsModal.focusModal();
        publish(this.messageContext, globalModalOpen, { status: 'true' });
        getChatbotMessage({ chatId: this.recordId, userId: userId }).then((res) => {
            this.chatbotMessage = res;
        });
    }

    closeModal() {
        this.modalOpen = false;
        publish(this.messageContext, globalModalOpen, { status: 'false' });
        const btn = this.template.querySelector('.focusBtn');
        btn.focus();
    }

    handleKeyboardEvent(event) {
        if (event.keyCode === 27 || event.code === 'Escape') {
            this.closeModal();
        } else if (event.keyCode === 9 || event.code === 'Tab') {
            this.termsModal.focusLoop();
        }
    }

    get termsModal() {
        return this.template.querySelector('c-community-modal');
    }

    /////////////////////////////////////////////////////////////

    @wire(getmessages, { threadId: '$threadId' }) //Calls apex and extracts messages related to this record
    wiremessages(result) {
        if (result.error) {
            this.error = result.error;
        } else if (result.data) {
            this.messages = result.data;
        }
    }
}
