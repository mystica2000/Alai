function initEvents() {
    const recordAudioBtn = document.getElementById("record");
    const streamAudioBtn = document.getElementById("stream");

    recordAudioBtn.addEventListener("click", () => {
        console.log("record audio clicked")
    })

    streamAudioBtn.addEventListener("click", () => {
        console.log("stream audio clicked")
    })
}

async function isServerUp() {
    try {
        const response = await fetch("http://localhost:8080");
        if (!response.ok) {
            throw new Error('Request failed', response.status)
        }
        return true;
    } catch (e) {
        console.error("Error: ", e);
    }
}

async function initializeWebSocketServer() {
    if (await isServerUp()) {

    }
}

document.addEventListener("DOMContentLoaded", () => {
    initEvents();
    initializeWebSocketServer();
})