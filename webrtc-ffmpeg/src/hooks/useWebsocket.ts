import { create } from "zustand";
import { useServerState } from "./useServerState";
import { useRecordState } from "./useRecordState";

interface Message {
    command: "stop" | "play" | "record" | "listen"
    payload?: number;
    data: any;
}

interface MessageResult {
    command: "stop_done" | "ice-candidate" | "answer"
    result: any;
    payload?: number;
}

interface WebsocketState {
    websocket: WebSocket | null;
    peerConnection: RTCPeerConnection | null
    audioStream: MediaStream | null;
    currentTask: "listen" | "record" | "";
    initializeWebsocket: () => void;
    initializePeerConnection: (command: "listen" | "record", id: number, stream?: MediaStream) => Promise<void>
    closePeerConnection: () => void;
    setCurrentTask: (task: "listen" | "record" | "") => void;
    sendMessage: (message: Message) => void;
}

const useWebSocketStore = create<WebsocketState>((set, get) => ({
    websocket: null,
    peerConnection: null,
    audioStream: null,
    currentTask: "",

    initializeWebsocket: () => {
        const ws = new WebSocket("/ws");

        ws.onopen = () => console.log("WebSocket connected");
        ws.onclose = () => console.log("WebSocket disconnected");
        ws.onerror = (error) => console.error("WebSocket error:", error);

        ws.onmessage = async (event) => {
            console.log("Websocket message received: ", event.data);

            try {
                const message: MessageResult = JSON.parse(event.data);

                if (message.command == "ice-candidate") {
                    const candidate = JSON.parse(message.result);
                    get().peerConnection?.addIceCandidate(new RTCIceCandidate(candidate));
                } else if (message.command == "answer") {

                    get().peerConnection?.addEventListener("track", (event) => {
                        set({ audioStream: event.streams[0] });
                    });

                    const answer = JSON.parse(message.result);

                    await get().peerConnection?.setRemoteDescription(answer);

                    if (get().currentTask == "record") {
                        useServerState.getState().addToLog({ type: "info", text: "🔴 Recording on Process" });
                    }

                } else if (message.command == "stop_done") {
                    if (get().currentTask == "listen") {
                        useRecordState.getState().stopAllRecords();
                    } else if (get().currentTask == "record") {
                        useServerState.getState().addToLog({ type: "info", text: "✅ Recording is Saved" });
                    }

                    set({ currentTask: "" })
                } else if (message.command == "play_done") {
                    if (message.result == "stop_done_initial_peer_connection") {
                        get().closePeerConnection();
                        set({ currentTask: "" })
                        get().initializePeerConnection("listen", Number(message.payload))
                    }
                }
                else {
                    console.log("Unknown command : ", message);
                }

            } catch (e: unknown) {
                console.error("Error in onmessage handler:", e);
            }
        }
        set({ websocket: ws });
    },

    initializePeerConnection: async (command: "record" | "listen", id = 0, stream?: MediaStream) => {
        const pc = new RTCPeerConnection();

        pc.ontrack = (event) => {
            console.log("Received track:", event.track.kind);
            set({ audioStream: event.streams[0] });
            useServerState.getState().addToLog({ type: "info", text: "⏳ Stream is Loading..." });
            set({ currentTask: "listen" })
        };

        if (stream && command == "record") {
            stream.getAudioTracks().forEach((track) => {
                pc.addTrack(track, stream);
            })
            set({ currentTask: "record" })
        }

        pc.onicecandidate = async (event) => {
            if (event.candidate) {
                get().websocket?.send(JSON.stringify({
                    command: 'ice-candidate',
                    data: event.candidate
                }));
            }
        };

        pc.onconnectionstatechange = () => {
            if (["closed", "disconnected", "failed"].includes(pc.connectionState)) {
                set({ audioStream: null });
                get().closePeerConnection();
                set({ currentTask: "" })
            } else {
                console.log("conecction statee ", pc.connectionState)
            }
        };

        pc.addTransceiver('audio', { direction: 'sendrecv' });

        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            get().websocket?.send(JSON.stringify({
                payload: id,
                command: command,
                data: offer
            }));

            if (get().currentTask == "record") {
                useServerState.getState().addToLog({ type: "info", text: "⏳ Preparing to record" });
            }
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


    setCurrentTask: (task: "listen" | "record" | "") => set({ currentTask: task }),

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