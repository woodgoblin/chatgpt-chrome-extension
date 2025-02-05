document.getElementById('reconnect').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: "reconnect" }, (response) => {
        if (response && response.status === "reconnecting") {
            document.getElementById('status').textContent = "Reconnecting...";
        } else if (response && response.status === "already connected") {
            document.getElementById('status').textContent = "Connected";
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    chrome.runtime.sendMessage({ action: "checkConnection" }, (response) => {
        if (response && response.connected) {
            document.getElementById('status').textContent = "Connected";
        } else {
            document.getElementById('status').textContent = "Disconnected";
        }
    });
});
