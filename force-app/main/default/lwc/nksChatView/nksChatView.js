import { LightningElement, api, wire } from 'lwc';
import getThreadId from '@salesforce/apex/nksChatView.getThreadId';
import markasread from '@salesforce/apex/CRM_MessageHelperExperience.markAsRead';
import getChatbotMessage from '@salesforce/apex/nksChatView.getChatbotMessage';
import { publish, MessageContext } from 'lightning/messageService';
import globalModalOpen from '@salesforce/messageChannel/globalModalOpen__c';
import userId from '@salesforce/user/Id';
import getmessages from '@salesforce/apex/CRM_MessageHelperExperience.getMessagesFromThread';
import getContactId from '@salesforce/apex/CRM_MessageHelperExperience.getUserContactId';
import { CurrentPageReference } from 'lightning/navigation';
import basepath from '@salesforce/community/basePath';

export default class NksChatView extends LightningElement {
    @api recordId;
    pageRefChatId;
    redirected = false;
    threadId;
    errorList = { title: '', errors: [] };
    modalOpen = false;
    userContactId;
    messages;
    chatbotMessage = 'Laster inn samtale';

    @wire(MessageContext)
    messageContext;

    @wire(CurrentPageReference)
    getStateParameters(currentPageReference) {
        if (currentPageReference) {
            this.pageRefChatId = currentPageReference.state?.id;
            this.redirected = currentPageReference.state?.redirected != null;
        }
    }

    connectedCallback() {
        this.redirect();
        getContactId({})
            .then((contactId) => {
                this.userContactId = contactId;
            })
            .catch(() => {
                //Apex error
            });
    }

    @wire(getThreadId, { chatId: '$pageRefChatId' })
    wireGetThreadId({ error, data }) {
        if (error) {
            console.error(error);
        }
        if (data) {
            this.threadId = data;
            markasread({ threadId: this.threadId });
        }
    }

    @wire(getmessages, { threadId: '$threadId' })
    wiremessages(result) {
        if (result.error) {
            this.error = result.error;
        } else if (result.data) {
            this.messages = result.data;
        }
    }

    handleModalButton() {
        this.modalOpen = true;
        this.termsModal.focusModal();
        publish(this.messageContext, globalModalOpen, { status: 'true' });
        getChatbotMessage({ chatId: this.pageRefChatId, userId: userId, isChatTranscript: this.redirected }).then(
            (res) => {
                this.chatbotMessage = res;
            }
        );
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

    // Redirect for static user notifications links
    redirect() {
        if (this.recordId != null && this.recordId !== '') {
            const link = basepath + '/chat?id=' + this.recordId + '&redirected=true';
            // eslint-disable-next-line @locker/locker/distorted-xml-http-request-window-open
            window.open(link, '_self');
        }
    }

    get termsModal() {
        return this.template.querySelector('c-community-modal');
    }
}
