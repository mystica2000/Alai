let ws;

function initEvents() {
    const recordAudioBtn = document.getElementById("record");
    const streamAudioBtn = document.getElementById("stream");
    const streaming = document.querySelector(".streaming");
    const recording = document.querySelector(".recording");


    recordAudioBtn.addEventListener("click", () => {
        console.log("record audio clicked");

        if (!streaming.classList.contains("hide")) {
            streaming.classList.toggle("hide");
        }

        recording.classList.remove("hide");


        const permissionbtn = document.getElementById("permission");
        permissionbtn.addEventListener("click", async () => {
            await this.askPermissionForAudio();
        })

    })

    streamAudioBtn.addEventListener("click", () => {
        console.log("stream audio clicked")

        if (!recording.classList.contains("hide")) {
            recording.classList.toggle("hide");
        }

        streaming.classList.remove("hide");
    })
}

async function askPermissionForAudio() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log("AUDIO GOT IT!!", stream);

    const pc = new RTCPeerConnection();

    pc.onicecandidate = async (event) => {
        if (event.candidate == null) {
            await pc.setLocalDescription(event.candidate);
            console.log(pc.localDescription);
            ws.send(btoa(JSON.stringify(pc.localDescription)));
        }
        console.log("ICE CANDIDATE!!", event);
    }

    stream.getAudioTracks().forEach((track) => {
        pc.addTrack(track, stream);
    });

    ws.onmessage = async (event) => {
        try {
            const message = event.data;
            const sdp = JSON.parse(atob(message));

            if (sdp.type == 'answer') {
                await pc.setRemoteDescription(new RTCSessionDescription(sdp));

                const element = document.getElementById("video1");
                element.muted = false;
            }

        } catch (e) {
            console.error(e);
        }
    }

    try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
    } catch (e) {
        console.log("Offer failed", e);
    }

}

async function isServerUp() {
    try {
        const response = await fetch("http://localhost:8080/server_test");
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
        console.log("Success");

        ws = new WebSocket("ws://localhost:8080/ws");

        ws.onerror = (e) => {
            console.error(e);
        }

    }
}

document.addEventListener("DOMContentLoaded", () => {
    initEvents();
    initializeWebSocketServer();
})