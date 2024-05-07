import { LightningElement, api, wire } from 'lwc';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getRecordNotifyChange } from 'lightning/uiRecordApi';
import getChatInfo from '@salesforce/apex/ChatAuthController.getChatInfo';
import setStatusRequested from '@salesforce/apex/ChatAuthController.setStatusRequested';
import getCommunityAuthUrl from '@salesforce/apex/ChatAuthController.getCommunityAuthUrl';
import getCounselorName from '@salesforce/apex/ChatAuthController.getCounselorName';
import AUTH_STARTED from '@salesforce/label/c.CRM_Chat_Authentication_Started';
import UNCONFIRMED_IDENTITY_WARNING from '@salesforce/label/c.CRM_Chat_Unconfirmed_Identity_Warning';
import IDENTITY_CONFIRMED_DISCLAIMER from '@salesforce/label/c.CRM_Chat_Identity_Confirmed_Disclaimer';
import AUTH_INIT_FAILED from '@salesforce/label/c.CRM_Chat_Authentication_Init_Failed';
import LOGIN_MESSAGE from '@salesforce/label/c.NKS_Chat_Login_Message';
import INITIATE_MESSAGE from '@salesforce/label/c.NKS_Chat_Initiate_Message';
import SEND_AUTH_REQUEST from '@salesforce/label/c.NKS_Chat_Send_Authentication_Request';
import SET_TO_REDACTION_LABEL from '@salesforce/label/c.NKS_Set_To_Redaction';

const STATUSES = {
    NOT_STARTED: 'Not Started',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    INPROGRESS: 'InProgress'
};

export default class ChatAuthenticationOverview extends LightningElement {
    @api recordId;
    @api loggingEnabled;

    labels = {
        authStarted: AUTH_STARTED,
        unconfirmedIdentityWarning: UNCONFIRMED_IDENTITY_WARNING,
        identityConfirmedDisclaimer: IDENTITY_CONFIRMED_DISCLAIMER,
        authInitFailed: AUTH_INIT_FAILED,
        loginMessage: LOGIN_MESSAGE,
        initiateMessage: INITIATE_MESSAGE,
        sendAuthRequest: SEND_AUTH_REQUEST,
        setToRedaction: SET_TO_REDACTION_LABEL
    };

    currentAuthenticationStatus;
    sendingAuthRequest = false;
    activeConversation;
    chatLanguage;
    chatAuthUrl;
    subscription = {};
    loginEvtSent = false;

    get isLoading() {
        return !this.currentAuthenticationStatus;
    }

    get cannotInitAuth() {
        return !(this.activeConversation && !this.sendingAuthRequest);
    }

    get authenticationRequested() {
        return this.currentAuthenticationStatus !== STATUSES.NOT_STARTED;
    }

    get authenticationStarted() {
        return (
            this.currentAuthenticationStatus === STATUSES.IN_PROGRESS ||
            this.currentAuthenticationStatus === STATUSES.COMPLETED
        );
    }

    get authenticationComplete() {
        return this.currentAuthenticationStatus === STATUSES.COMPLETED;
    }

    get isEmpSubscribed() {
        return Object.keys(this.subscription).length !== 0 && this.subscription.constructor === Object;
    }

    connectedCallback() {
        this.getAuthUrl();
        this.registerErrorListener();
    }

    registerErrorListener() {
        onError((error) => {
            console.error('Received error from empApi: ', JSON.stringify(error));
            this.handleUnsubscribe();
            this.handleSubscribe();
        });
    }

    @wire(getChatInfo, { chatTranscriptId: '$recordId' })
    wiredStatus({ error, data }) {
        if (data) {
            this.log(data);
            this.currentAuthenticationStatus = data.AUTH_STATUS;
            this.activeConversation = data.CONVERSATION_STATUS === STATUSES.INPROGRESS;
            this.chatLanguage = data.CHAT_LANGUAGE;

            if (this.currentAuthenticationStatus !== STATUSES.COMPLETED && !this.isLoading && !this.isEmpSubscribed) {
                this.handleSubscribe();
            }
        } else {
            this.currentAuthenticationStatus = STATUSES.NOT_STARTED;
            this.log(error);
        }
    }

    getAuthUrl() {
        getCommunityAuthUrl({})
            .then((url) => {
                this.chatAuthUrl = url;
            })
            .catch((error) => {
                console.error('Failed to retrieve auth url: ', JSON.stringify(error));
            });
    }

    handleSubscribe() {
        const messageCallback = (response) => {
            console.log('AUTH STATUS UPDATED');
            const eventRecordId = response.data.sobject.Id;
            if (eventRecordId === this.recordId) {
                this.currentAuthenticationStatus = response.data.sobject.CRM_Authentication_Status__c;
                if (this.authenticationComplete) {
                    if (!this.loginEvtSent) this.sendLoginEvent();
                    getRecordNotifyChange([{ recordId: this.recordId }]);
                    this.handleUnsubscribe();
                }
            }
        };

        subscribe('/topic/Chat_Auth_Status_Changed', -1, messageCallback)
            .then((response) => {
                this.subscription = response;
                console.log('Successfully subscribed to: ', JSON.stringify(response.channel));
            })
            .catch((error) => {
                console.error('Failed to subscribe: ', JSON.stringify(error));
            });
    }

    handleUnsubscribe() {
        unsubscribe(this.subscription)
            .then((response) => {
                console.log('Unsubscribed: ', JSON.stringify(response));
            })
            .catch((error) => {
                console.error('EMP unsubscribe failed: ', JSON.stringify(error));
            });
    }

    sendLoginEvent() {
        getCounselorName({ recordId: this.recordId })
            .then((data) => {
                const loginMessage = `${this.labels.initiateMessage} ${data}. ${this.labels.loginMessage}`;
                const authenticationCompleteEvt = new CustomEvent('authenticationcomplete', {
                    detail: { loginMessage }
                });
                this.dispatchEvent(authenticationCompleteEvt);
                this.loginEvtSent = true;
            })
            .catch((error) => {
                console.error('Failed to fetch counselor name: ', JSON.stringify(error));
            });
    }

    requestAuthentication() {
        this.sendingAuthRequest = true;
        const authUrl = this.chatAuthUrl;
        const requestAuthenticationEvent = new CustomEvent('requestauthentication', {
            detail: { authUrl }
        });
        this.dispatchEvent(requestAuthenticationEvent);
    }

    setAuthStatusRequested() {
        setStatusRequested({ chatTranscriptId: this.recordId })
            .then(() => {
                this.log('Successful update');
            })
            .catch((error) => {
                this.log(error);
            })
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

    log(loggable) {
        if (this.loggingEnabled) console.log(loggable);
    }
}
