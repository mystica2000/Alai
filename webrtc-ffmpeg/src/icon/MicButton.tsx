import { useServerState } from "@/hooks/useServerState";
import { useEffect, useState } from "react"

export default function MicButton() {

    const [micOn, setMicOn] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>();

    const handleMicOn = async () => {

        if (micOn) {
            setMicOn((prevMic) => !prevMic);
            peerConnection?.close();
        } else {
            const result = await askMicPermission();
            if (result != null) {
                setMicOn((prevMic) => !prevMic);
            }
        }
    }

    const addToLog = useServerState((state) => state.addToLog);

    const startWS = (): Promise<WebSocket> => {
        return new Promise((resolve, reject) => {

            const wsConnection = new WebSocket("http://localhost:8080/ws");

            wsConnection.onerror = (error) => {
                console.log("connection error");
                reject(error);
            }

            wsConnection.onclose = (event) => {
                console.log("connection closed");
                if (!event.wasClean) {
                    reject(new Error("WebSocket connection closed unexpectedly"));
                }
            }

            wsConnection.onopen = () => {
                console.log("WebSocket connection opened");
                resolve(wsConnection);
            }

        })
    }

    const initializePeerConnection = async (stream: MediaStream, websocket: WebSocket) => {
        const currentWebSocket = websocket;
        console.log("Current WebSocket:", currentWebSocket);

        if (websocket?.OPEN) {
            const pc = new RTCPeerConnection();

            pc.onicecandidate = async (event) => {
                if (event.candidate == null) {
                    websocket.send(JSON.stringify({ type: "offer", msg: btoa(JSON.stringify(pc.localDescription)) }));
                }
            }

            stream.getAudioTracks().forEach((track) => {
                pc.addTrack(track, stream);
            })

            websocket.onmessage = async (event) => {
                try {
                    const message = event?.data;
                    const sdp: RTCSessionDescription = JSON.parse(atob(message));

                    if (sdp.type == "answer") {
                        await pc.setRemoteDescription(sdp);
                    }

                } catch (e: unknown) {
                    console.log(e);
                }
            }

            try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);

                setPeerConnection(pc);
            } catch (e) {
                console.log("Offer failed");
            }

        } else {
            console.log("Websockie gone")
        }
    }

    const askMicPermission = async (): Promise<MediaStream | null> => {
        try {

            const websocket = await startWS();

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    "sampleSize": 16,
                    "channelCount": 2,
                    "echoCancellation": true
                }
            });

            const audioContext = new AudioContext();
            audioContext.createMediaStreamSource(stream).connect(audioContext.createMediaStreamDestination());

            await initializePeerConnection(stream, websocket);

            addToLog({ type: "info", text: "✅ Microphone" });

            audioContext

            return stream;
        } catch (e: unknown) {
            addToLog({ type: "error", text: "Allow Microphone Connection for recording" });
            return null;
        }
    }

    useEffect(() => {
        if (micOn) {

            const interval = setInterval(() => {
                setIsActive((prevIsActive) => !prevIsActive)
            }, 1000);

            return () => clearInterval(interval);
        } else {
            setIsActive(false);
        }
    }, [micOn]);

    return (
        <button onClick={() => handleMicOn()}>
            <svg width="226" height="226" viewBox="0 0 226 226" fill="none" xmlns="http://www.w3.org/2000/svg" className=" sm:scale-100 md:scale-125 lg:scale-125">
                <g id="mic-stop">
                    <circle id="circle-5"
                        r={isActive ? 110.5 : 100}
                        cx="113" cy="113"
                        className="transition-all duration-1000 ease-in-out"

                        stroke="#47ED76" strokeOpacity="0.62" strokeWidth="3" />
                    <circle id="circle-4"
                        className="transition-all duration-1000 ease-in-out"

                        r={isActive ? 109 : 90} cx="113" cy="113" fill="#47ED76" />
                    <circle id="circle-3" cx="113" cy="115"
                        className="transition-all duration-1000 ease-in-out"

                        r={isActive ? 92 : 83} fill="#28F561" />
                    <circle id="circle-2" cx="113" cy="113"
                        className="transition-all duration-1000 ease-in-out"

                        r={isActive ? 78 : 69} fill="#28F561" />
                    <circle id="circle-1" opacity="0.1" cx="113" cy="113"
                        className="transition-all duration-1000 ease-in-out"

                        r={isActive ? 64 : 55} fill="#47ED76" />

                    {micOn ?
                        <rect id="Rectangle 2" x="63" y="63" width="100" height="100" fill="#1E1E1E"
                            transform={`scale(${isActive ? 1 : 0.8})`}
                            className="transition-all duration-1000 ease-in-out"
                            style={{
                                transformOrigin: "center",
                            }}
                        /> : <path id="Polygon 1" d="M167 115L75.5 167.828L75.5 62.1725L167 115Z" fill="#1E1E1E" />
                    }
                </g>
            </svg>
        </button>
    )
}