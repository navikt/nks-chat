import { LightningElement } from 'lwc';
import setStatusCompleted from '@salesforce/apex/ChatAuthController.setStatusCompleted';

export default class ScratchSimulateChatAuth extends LightningElement {
    initAuth() {
        let chatId = this.inputField.value;
        console.log('INIT AUTH: ' + chatId);
        if (chatId && chatId != '') {
            setStatusCompleted({ chatTranscriptId: chatId })
                .then((result) => {
                    console.log(result);
                })
                .catch((error) => {
                    console.log(error);
                });
        }
    }

    get inputField() {
        return this.template.querySelector('lightning-input');
    }
}
