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

const STATUSES = {
    NOT_STARTED: 'Not Started',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    INPROGRESS: 'InProgress',
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

    currentAuthenticationStatus;
    sendingAuthRequest = false;
    isActiveConversation = true;
    chatLanguage;
    chatAuthUrl;
    empApiSubscription = {};
    lmsSubscription = null;
    loginEvtSent = false;
    chatEnded = false;
    endTime = null;

    @wire(MessageContext)
    messageContext;

    @wire(getChatInfo, { messagingId: '$recordId' })
    wiredStatus({ error, data }) {
        if (data) {
            this.currentAuthenticationStatus = data.AUTH_STATUS;
            this.endTime = data.END_TIME;

            if (this.currentAuthenticationStatus !== STATUSES.COMPLETED && !this.isLoading && !this.isEmpSubscribed) {
                this.handleSubscribe();
            }
        } else {
            this.currentAuthenticationStatus = STATUSES.NOT_STARTED;
            this.log(error);
        }
    }

    connectedCallback() {
        this.getAuthUrl();
        this.registerErrorListener();
        this.subscribeToMessageChannel();
    }

    get isLoading() {
        return !this.currentAuthenticationStatus;
    }

    get cannotInitAuth() {
        return !(this.isActiveConversation && !this.sendingAuthRequest);
    }

    get isAuthenticating() {
        return this.currentAuthenticationStatus === STATUSES.AUTHREQUESTED;
    }

    get authenticationComplete() {
        return this.currentAuthenticationStatus === STATUSES.COMPLETED;
    }

    get isEmpSubscribed() {
        return Object.keys(this.empApiSubscription).length !== 0 && this.empApiSubscription.constructor === Object;
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
            console.error('Received error from empApi: ', JSON.stringify(error));
           /**
            * Subscription to empApi fails, leading to an endless resubscription loop due to immediate retry in error handling.
            * This may be caused by the Chat_Auth_Status_Changed topic not existing in Salesforce.
            // TODO: Verify that the Chat_Auth_Status_Changed topic is created and accessible.
            */
           
            //this.handleUnsubscribe();
            //this.handleSubscribe();
        });
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

        empApiSubscribe('/topic/Chat_Auth_Status_Changed', -1, messageCallback)
            .then((response) => {
                this.empApiSubscription = response;
                console.log('Successfully subscribed to: ', JSON.stringify(response.channel));
            })
            .catch((error) => {
                console.error('Failed to subscribe: ', JSON.stringify(error));
            });
    }

    handleUnsubscribe() {
        unsubscribe(this.empApiSubscription)
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
                const loginMessage =
                    this.chatLanguage === 'en_US'
                        ? 'You are now in a secure chat with NAV, you are chatting with ' +
                          data +
                          '. ' +
                          this.labels.CHAT_LOGIN_MSG_EN
                        : 'Du er nå i en innlogget chat med NAV, du snakker med ' +
                          data +
                          '. ' +
                          this.labels.CHAT_LOGIN_MSG_NO;

                const authenticationCompleteEvt = new CustomEvent('authenticationcomplete', {
                    detail: { loginMessage }
                });
                this.dispatchEvent(authenticationCompleteEvt);
                this.loginEvtSent = true;
            })
            .catch((err) => {
                console.err(err);
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
