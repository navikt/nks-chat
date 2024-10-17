import { LightningElement } from 'lwc';

export default class NksCustomChat extends LightningElement {
    connectedCallback() {
        const conversationBody = document.querySelector('[data-target-selection-name="scrt_conversationBody"]')
        const txtArea = conversationBody.querySelector('textarea');
        txtArea.addEventListener('keyup', (event) => {
            const valer = event.target.value;
            console.log(valer);
            if(valer === 'velociraptor') {
                event.target.value = 'WOW, that\'s a crazy velociraptor. And btw Eirik is a noob.'
            }
        })
    }

    // connectedCallback() {
    //     this._observeChatComponent();
    // }

    // _observeChatComponent() {
    //     const targetElement = document.querySelector('[data-target-selection-name="scrt_conversationBody"]');
    //     if (targetElement) {
    //         const config = { childList: true, subtree: true, attributes: true };
    //         const observer = new MutationObserver((mutationsList, observer) => {
    //             console.log('Setting observer');
    //             this._attachEventListenersToTextarea(targetElement);
    //             observer.disconnect();
    //         });

    //         observer.observe(targetElement, config);
    //     }
    // }

    // _attachEventListenersToTextarea(targetElement) {
    //     const textarea = targetElement.querySelector('textarea');
    //     if (textarea) {
    //         textarea.addEventListener('focus', () => {
    //             console.log('Textarea focused.');
    //         });

    //         textarea.addEventListener('change', () => {
    //             console.log('Textarea value changed.');
    //         });

    //         textarea.addEventListener('input', () => {
    //             console.log('Textarea input detected.');
    //         });
    //     }
    // }
}