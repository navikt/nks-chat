import { LightningElement, api, wire } from 'lwc';
import { subscribe as empApiSubscribe, unsubscribe, onError } from 'lightning/empApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getRecordNotifyChange } from 'lightning/uiRecordApi';
import getChatInfo from '@salesforce/apex/ChatAuthController.getMessagingInfo';
import setStatusRequested from '@salesforce/apex/ChatAuthController.setStatusRequested';
import getCommunityAuthUrl from '@salesforce/apex/ChatAuthControllerExperience.getCommunityAuthUrl';
import getCounselorName from '@salesforce/apex/ChatAuthController.getCounselorName';
import AUTH_STARTED from '@salesforce/label/c.CRM_Chat_Authentication_Started';
import IDENTITY_CONFIRMED_DISCLAIMER from '@salesforce/label/c.CRM_Chat_Identity_Confirmed_Disclaimer';
import SEND_AUTH_REQUEST from '@salesforce/label/c.NKS_Chat_Send_Authentication_Request';
import SET_TO_REDACTION_LABEL from '@salesforce/label/c.NKS_Set_To_Redaction';
import CHAT_LOGIN_MSG_NO from '@salesforce/label/c.NKS_Chat_Login_Message_NO';
import CHAT_LOGIN_MSG_EN from '@salesforce/label/c.NKS_Chat_Login_Message_EN';
import CHAT_GETTING_AUTH_STATUS from '@salesforce/label/c.NKS_Chat_Getting_Authentication_Status';
import CHAT_SENDING_AUTH_REQUEST from '@salesforce/label/c.NKS_Chat_Sending_Authentication_Request';
import { subscribe, APPLICATION_SCOPE, MessageContext } from 'lightning/messageService';
import ConversationEndedChannel from '@salesforce/messageChannel/lightning__conversationEnded';
import { refreshApex } from '@salesforce/apex';

const STATUSES = {
    NOT_STARTED: 'Not Started',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    AUTHREQUESTED: 'Authentication Requested'
};

export default class ChatAuthenticationOverview extends LightningElement {
    @api recordId;
    @api loggingEnabled;

    labels = {
        AUTH_STARTED,
        IDENTITY_CONFIRMED_DISCLAIMER,
        SEND_AUTH_REQUEST,
        SET_TO_REDACTION_LABEL,
        CHAT_LOGIN_MSG_NO,
        CHAT_LOGIN_MSG_EN,
        CHAT_GETTING_AUTH_STATUS,
        CHAT_SENDING_AUTH_REQUEST
    };

    currentAuthenticationStatus = STATUSES.NOT_STARTED;
    sendingAuthRequest = false;
    chatLanguage;
    chatAuthUrl = '';
    empApiSubscription = null;
    lmsSubscription = null;
    loginEvtSent = false;
    chatEnded = false;
    endTime = null;
    wiredRecordResult;

    @wire(MessageContext) messageContext;

    @wire(getChatInfo, { messagingId: '$recordId' })
    loadChatInfo({ error, data }) {
        if (data) {
            this.currentAuthenticationStatus = data.AUTH_STATUS;
            this.endTime = data.END_TIME;
            this.chatLanguage = data.CHAT_LANGUAGE;

            if (this.isEmpSubscriptionNeeded) {
                this.handleSubscribe();
            }
        } else {
            this.handleError(error);
        }
    }

    connectedCallback() {
        this.loadAuthUrl();
        this.subscribeToMessageChannel();
        this.registerErrorListener();
    }

    get isLoading() {
        return !this.currentAuthenticationStatus;
    }

    get isAuthenticating() {
        return this.currentAuthenticationStatus === STATUSES.AUTHREQUESTED;
    }

    get authenticationComplete() {
        return this.currentAuthenticationStatus === STATUSES.COMPLETED;
    }

    get isEmpSubscriptionNeeded() {
        return !this.authenticationComplete && !this.isEmpSubscribed && !this.isLoading;
    }

    get isEmpSubscribed() {
        return !!this.empApiSubscription;
    }

    get showAuthInfo() {
        return !this.chatEnded && !this.endTime;
    }

    subscribeToMessageChannel() {
        if (!this.lmsSubscription) {
            this.lmsSubscription = subscribe(
                this.messageContext,
                ConversationEndedChannel,
                (message) => this.handleMessage(message),
                { scope: APPLICATION_SCOPE }
            );
        }
    }

    handleMessage(message) {
        if (this.recordId === message.recordId) {
            this.chatEnded = true;
        }
    }

    registerErrorListener() {
        onError((error) => {
            this.handleError(error);
            this.handleUnsubscribe();
            this.handleSubscribe();
        });
    }

    loadAuthUrl() {
        getCommunityAuthUrl()
            .then((url) => {
                this.chatAuthUrl = url;
            })
            .catch((error) => this.handleError(error, 'Failed to retrieve auth URL'));
    }

    handleSubscribe() {
        empApiSubscribe('/data/MessagingSessionChangeEvent', -1, this.handleCdcEvent.bind(this))
            .then((response) => {
                this.empApiSubscription = response;
                console.log(`Subscribed to: ${response.channel}`);
            })
            .catch((error) => this.handleError(error, 'Failed to subscribe'));
    }

    handleUnsubscribe() {
        if (this.isEmpSubscribed) {
            unsubscribe(this.empApiSubscription)
                .then(() => {
                    this.empApiSubscription = null;
                })
                .catch((error) => this.handleError(error, 'Failed to unsubscribe'));
        }
    }

    handleCdcEvent(response) {
        const eventRecordIds = response.data.payload.ChangeEventHeader.recordIds;
        const changedFields = response.data.payload.ChangeEventHeader.changedFields;

        if (eventRecordIds.includes(this.recordId) && changedFields.includes('CRM_Authentication_Status__c')) {
            this.updateAuthStatus(response.data.payload.CRM_Authentication_Status__c);
        }
    }

    updateAuthStatus(newStatus) {
        this.currentAuthenticationStatus = newStatus;

        if (this.authenticationComplete) {
            this.sendLoginEvent();
            getRecordNotifyChange([{ recordId: this.recordId }]);
            this.handleUnsubscribe();
        }
    }

    sendLoginEvent() {
        if (!this.loginEvtSent) {
            getCounselorName({ recordId: this.recordId })
                .then((name) => {
                    const loginMessage =
                        this.chatLanguage === 'en_US'
                            ? `You are now in a secure chat with Nav, chatting with ${name}. ${this.labels.CHAT_LOGIN_MSG_EN}`
                            : `Du er nå i en innlogget chat med Nav, du snakker med ${name}. ${this.labels.CHAT_LOGIN_MSG_NO}`;

                    this.dispatchEvent(new CustomEvent('authenticationcomplete', { detail: { loginMessage } }));
                    this.loginEvtSent = true;
                })
                .catch(this.handleError);
        }
    }

    requestAuthentication() {
        this.sendingAuthRequest = true;
        this.dispatchEvent(new CustomEvent('requestauthentication', { detail: { authUrl: this.chatAuthUrl } }));
    }

    setAuthStatusRequested() {
        setStatusRequested({ messagingId: this.recordId })
            .then(() => console.log('Status updated successfully'))
            .catch(this.handleError)
            .finally(() => {
                this.sendingAuthRequest = false;
            });
    }

    @api
    authRequestHandling(success) {
        if (success) {
            this.setAuthStatusRequested();
        } else {
            this.showAuthError();
        }
    }

    showAuthError() {
        const event = new ShowToastEvent({
            title: 'Authentication error',
            message: this.labels.authInitFailed,
            variant: 'error',
            mode: 'sticky'
        });
        this.dispatchEvent(event);
    }

    handleError(error, context = '') {
        const message = context ? `${context}: ${JSON.stringify(error)}` : JSON.stringify(error);
        console.error(message);
    }

    log(loggable) {
        if (this.loggingEnabled) console.log(loggable);
    }

    refreshData() {
        if (this.wiredRecordResult) {
            refreshApex(this.wiredRecordResult);
        }
    }
}
