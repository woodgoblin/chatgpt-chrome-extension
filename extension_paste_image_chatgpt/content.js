console.log('[Image Paste Extension] Content script loaded.');

// Only try to send message if chrome.runtime is available
chrome.runtime?.sendMessage?.({ action: "contentScriptReady" });

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    console.log('[Image Paste Extension] Message received:', message);
    if (message.imageSrc) {
        handleIncomingImage(message.imageSrc);
    }
    sendResponse({ status: "received" });
});

async function handleIncomingImage(src) {
    const contentEditable = document.querySelector('#prompt-textarea');
    if (!contentEditable) {
        console.error('[Image Paste Extension] Error: ChatGPT prompt text area not found.');
        return;
    }

    try {
        // Convert base64 to Blob then to File object
        const base64Data = src.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/png' });
        const file = new File([blob], 'pasted-image.png', { type: 'image/png' });
        
        const dt = new DataTransfer();
        dt.items.add(file);

        contentEditable.focus();
        const pasteEvent = new ClipboardEvent('paste', {
            bubbles: true,
            cancelable: true,
            clipboardData: dt
        });
        contentEditable.dispatchEvent(pasteEvent);
        
        // Simulate pressing the "Enter" key after pasting
        setTimeout(() => {
            const enterEvent = new KeyboardEvent('keydown', {
            key: "Enter",
            code: "Enter",
            bubbles: true,
            cancelable: true
            });
            contentEditable.dispatchEvent(enterEvent);
            setTimeout(() => {
                const readAloudButton = document.querySelector('button[aria-label="Read aloud"][data-testid="voice-play-turn-action-button"]');
                if (readAloudButton) {
                    readAloudButton.click();
                } else {
                    console.error('[Image Paste Extension] Error: Read aloud button not found.');
                }
            }, 8000);
        }, 5000);

        

        contentEditable.dispatchEvent(enterEvent);
    } catch (error) {
        console.error('[Image Paste Extension] Error processing image:', error);
    }
}
