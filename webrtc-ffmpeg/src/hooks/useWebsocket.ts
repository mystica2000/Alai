import { isJsonMessageSDP } from "@/lib/utils";
import { create } from "zustand";

interface WebsocketState {
    websocket: WebSocket | null;
    peerConnection: RTCPeerConnection | null
    audioStream: MediaStream | null
    initializeWebsocket: () => void;
    initializePeerConnection: (id: number) => Promise<void>
    closePeerConnection: () => void;
    setAudioStream: (stream: MediaStream | null) => void;
    sendMessage: (message: any) => void;
}

const useWebSocketStore = create<WebsocketState>((set, get) => ({
    websocket: null,
    peerConnection: null,
    audioStream: null,

    initializeWebsocket: () => {
        const ws = new WebSocket("http://localhost:8080/ws");

        ws.onopen = () => console.log("WebSocket connected");
        ws.onclose = () => console.log("WebSocket disconnected");
        ws.onerror = (error) => console.error("WebSocket error:", error);

        ws.onmessage = async (event) => {
            console.log("Websocket message received: ", event.data);

            try {
                const message = event.data;
                if (isJsonMessageSDP(message)) {
                    const sdp = JSON.parse(atob(message));
                    if (sdp.type === "answer") {
                        get().peerConnection?.addEventListener("track", (event) => {
                            console.log("Received track:", event.track.kind);
                            set({ audioStream: event.streams[0] });
                        });
                        await get().peerConnection?.setRemoteDescription(sdp);
                    }
                } else {
                    const msg = JSON.parse(message);
                    if (msg.msg === "stop_done_initial_peer_connection") {
                        get().closePeerConnection();
                        get().initializePeerConnection(Number(msg.ID))
                    }
                }
            } catch (e: unknown) {
                console.error("Error in onmessage handler:", e);
            }
        }
        set({ websocket: ws });
    },

    initializePeerConnection: async (id: number) => {
        const pc = new RTCPeerConnection();

        pc.ontrack = (event) => {
            console.log("Received track:", event.track.kind);
            set({ audioStream: event.streams[0] });
        };

        pc.onicecandidate = async (event) => {
            if (event.candidate === null) {
                const { websocket } = get();
                websocket?.send(JSON.stringify({
                    type: "offer",
                    payload: id,
                    option: "listen",
                    msg: btoa(JSON.stringify(pc.localDescription))
                }));
            }
        };

        pc.onconnectionstatechange = () => {
            if (["closed", "disconnected", "failed"].includes(pc.connectionState)) {
                set({ audioStream: null });
                get().closePeerConnection();
            } else {
                console.log("conecction statee ", pc.connectionState)
            }
        };

        pc.addTransceiver('audio', { direction: 'sendrecv' });

        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
        } catch (e) {
            console.error("Offer creation failed:", e);
        }


        set({ peerConnection: pc });
    },

    closePeerConnection: () => {
        const { peerConnection } = get();
        if (peerConnection) {
            peerConnection.close();
            set({ peerConnection: null, audioStream: null });
        }
    },

    setAudioStream: (stream: MediaStream | null) => set({ audioStream: stream }),

    sendMessage: (message: any) => {
        const { websocket } = get();
        if (websocket?.readyState === WebSocket.OPEN) {
            websocket.send(JSON.stringify(message));
        } else {
            console.error("WebSocket is not open");
        }
    },

}))


export default useWebSocketStore;