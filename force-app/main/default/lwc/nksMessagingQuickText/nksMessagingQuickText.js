import { LightningElement, wire } from 'lwc';
import getQuicktexts from '@salesforce/apex/CRM_HenvendelseQuicktextController.getQuicktexts';

const QUICK_TEXT_TRIGGER_KEYS = ['Enter', ' ', ','];

export default class nksMessagingQuickText extends LightningElement {
    quickTextMap;

    connectedCallback() {
        const conversationBody = document.querySelector('[data-target-selection-name="scrt_conversationBody"]');
        const editor = conversationBody.querySelector('textarea');
        editor.addEventListener('keyup', (event) => {
            if (QUICK_TEXT_TRIGGER_KEYS.includes(event.key)) {
                this.insertquicktext(event, editor);
            }
        });
    }

    @wire(getQuicktexts, {})
    wiredQuicktexts({ error, data }) {
        if (error) {
            console.error(error);
        } else if (data) {
            this.quickTextMap = data.map((key) => {
                return {
                    abbreviation: key.nksAbbreviationKey__c,
                    content: { message: key.Message, isCaseSensitive: key.Case_sensitive__c }
                };
            });
        }
    }

    insertquicktext(event, editor) {
        const carretPositionEnd = editor.selectionEnd;
        const lastItem = editor.value
            .substring(0, carretPositionEnd)
            .replace(/(\r\n|\n|\r)/g, ' ')
            .trim()
            .split(' ')
            .pop();

        const lastWord = lastItem.replace(event.key, '');

        let obj = this._getQmappedItem(lastWord);

        if (obj !== undefined) {
            const quickText = obj.content.message;
            const isCaseSensitive = obj.content.isCaseSensitive;
            const startindex = carretPositionEnd - lastWord.length - 1;
            const lastChar = event.key === 'Enter' ? '\n' : event.key;

            if (isCaseSensitive) {
                const words = quickText.split(' ');

                if (lastItem.charAt(0) === lastItem.charAt(0).toLowerCase()) {
                    words[0] = words[0].toLowerCase();
                    const lowerCaseQuickText = words.join(' ');
                    this._replaceWithQuickText(editor, lowerCaseQuickText + lastChar, startindex, carretPositionEnd);
                } else if (lastItem.charAt(0) === lastItem.charAt(0).toUpperCase()) {
                    const upperCaseQuickText = quickText.charAt(0).toUpperCase() + quickText.slice(1);
                    this._replaceWithQuickText(editor, upperCaseQuickText + lastChar, startindex, carretPositionEnd);
                }
            } else {
                this._replaceWithQuickText(editor, quickText + lastChar, startindex, carretPositionEnd);
            }
        } else {
            // Clear screen reader buffer for reading the next one.
            this.recentlyInserted = '';
        }
    }

    _getQmappedItem(abbreviation) {
        for (const item of this.quickTextMap) {
            if (item.abbreviation.toUpperCase() !== item.content.message) {
                item.abbreviation = item.abbreviation.toUpperCase();
                if (item.abbreviation === abbreviation.toUpperCase()) {
                    return item;
                }
            }
            if (item.abbreviation === abbreviation) {
                return item;
            }
        }
        return null;
    }

    _replaceWithQuickText(editor, replacement, start, end) {
        editor.setRangeText(replacement, start, end, 'end');
        editor.dispatchEvent(new CustomEvent('input', { bubbles: true }));
        this.recentlyInserted = replacement;
    }
}
