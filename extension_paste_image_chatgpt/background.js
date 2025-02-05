let socket;

function connectWebSocket() {
    socket = new WebSocket('ws://localhost:8080');

    socket.addEventListener('open', () => {
        console.log('WebSocket connected.');
    });

    socket.addEventListener('message', async event => {
        try {
            const blob = event.data;
            if (!(blob instanceof Blob)) {
                console.error('Received data is not a Blob');
                return;
            }

            const reader = new FileReader();
            reader.onload = function() {
                const base64String = reader.result;
                chrome.tabs.query({ title: "ChatGPT", active: true }, tabs => {
                    if (tabs.length > 0) {
                        chrome.tabs.sendMessage(tabs[0].id, { 
                            imageSrc: base64String,
                            type: blob.type 
                        }, () => {
                            if (chrome.runtime.lastError) {
                                console.error("Error sending imageSrc:", chrome.runtime.lastError);
                            }
                        });
                    }
                });
            };
            reader.readAsDataURL(blob);
        } catch (error) {
            console.error('Error processing WebSocket message:', error);
        }
    });

    socket.addEventListener('close', () => {
        console.log('WebSocket disconnected. Reconnecting in 5 seconds...');
        setTimeout(connectWebSocket, 5000);
    });

    socket.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
        socket.close();
    });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "contentScriptReady") {
        sendResponse({ status: "registered" });
    } else if (message.action === "checkConnection") {
        sendResponse({ connected: socket && socket.readyState === WebSocket.OPEN });
    } else if (message.action === "reconnect") {
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            connectWebSocket();
            sendResponse({ status: "reconnecting" });
        } else {
            sendResponse({ status: "already connected" });
        }
    }
});

connectWebSocket();
