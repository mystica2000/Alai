let ws: WebSocket;

function initEvents() {
  const recordAudioBtn = document.getElementById("record");
  const streamAudioBtn = document.getElementById("stream");
  const streaming = document.querySelector(".streaming");
  const recording = document.querySelector(".recording");


  recordAudioBtn?.addEventListener("click", () => {
    console.log("record audio clicked");

    if (!streaming?.classList.contains("hide")) {
      streaming?.classList.toggle("hide");
    }

    recording?.classList.remove("hide");


    const permissionbtn = document.getElementById("permission");
    permissionbtn?.addEventListener("click", async () => {
      const controls = document.getElementById("controls");
      controls?.classList.remove("hide");

      initializeWebSocketServer();

      await askPermissionForAudio();
    })

  })

  streamAudioBtn?.addEventListener("click", () => {
    console.log("stream audio clicked")

    if (!recording?.classList.contains("hide")) {
      recording?.classList.toggle("hide");
    }

    streaming?.classList.remove("hide");
  })
}

async function askPermissionForAudio() {


  const infoDiv = document.getElementById("info");
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      "sampleSize": 16,
      "channelCount": 2,
      "echoCancellation": true
    }
  });

  const pc = new RTCPeerConnection();

  pc.onicecandidate = async (event) => {
    if (event.candidate == null) {
      ws.send(btoa(JSON.stringify(pc.localDescription)));
    }
  }

  stream.getAudioTracks().forEach((track) => {
    pc.addTrack(track, stream);
  });

  ws.onmessage = async (event) => {
    try {
      const message = event.data;
      const sdp = JSON.parse(atob(message));

      if (sdp.type == 'answer') {

        let count = 5;
        const interval = setInterval(() => {

          if (infoDiv) {
            infoDiv.innerHTML = "starts in " + count;
          }

          count--;
        }, 1000);

        setTimeout(async () => {
          clearInterval(interval);


          if (infoDiv) {
            infoDiv.innerHTML = "recording...";
          }

          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        }, 5000);



        const element: HTMLVideoElement = document.getElementById("video1") as HTMLVideoElement;
        element.muted = false;
      }

    } catch (e) {
      console.error(e);
    }
  }

  const stopBtn = document.getElementById("stop");
  stopBtn?.addEventListener("click", () => {
    console.log("stoping ocnnection!");
    pc.close();

    if (infoDiv) {
      infoDiv.innerHTML = "over!";
      ws.close();
    }
  })

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
      throw new Error('Request failed' + response)
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
})