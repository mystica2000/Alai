import { usePlayStopState } from "@/hooks/useServerState";
import PlayButton from "@/icon/PlayButton";
import StopButton from "@/icon/StopButton";
import { useRef, useState, useEffect } from "react";

interface ARecordProps {
    id: number;
    websocketConnection: WebSocket | undefined
}

export default function ButtonControls({ id, websocketConnection }: ARecordProps) {

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
    const [peerConnection, setPeerConnection] = useState<RTCPeerConnection>();
    const { playRecord, stopAllRecords, stopRecord, getPlayingRecord } = usePlayStopState();

    const allStopped = usePlayStopState((state) => state.allStopped);
    const setAllStopped = usePlayStopState((state) => state.setAllStopped);

    useEffect(() => {

        if (allStopped) {
            setAllStopped(false);

            if (audioRef.current) {
                audioRef.current.srcObject = null;
                audioRef.current.currentTime = 0;
                audioRef.current.pause();
            }
        }

    }, [allStopped, setAllStopped])


    useEffect(() => {
        // Effect to handle audio stream changes
        if (audioRef.current && audioStream) {
            console.log("settingggg@!")
            audioRef.current.srcObject = audioStream;
            audioRef.current.play().catch(e => console.error("Error playing audio:", e));
        }
    }, [audioStream]);

    // FIXED: Probelm is audioRef have to be, stop all the audio Ref.. not only current!
    // so store it on global state and update stopAllRecords function so that, it pauses and stops resets all tthe audio

    const initializePeerConnection = async () => {
        console.log("Current WebSocket:", websocketConnection);

        if (websocketConnection?.OPEN) {
            const pc = new RTCPeerConnection();

            setPeerConnection(pc);

            pc.addTransceiver('audio', {
                direction: 'sendrecv'
            })

            pc.ontrack = function (event: any) {
                setAudioStream(event.streams[0]);
            }

            pc.onicecandidate = async (event) => {
                if (event.candidate == null) {
                    websocketConnection.send(JSON.stringify({ type: "offer", payload: id, option: "listen", msg: btoa(JSON.stringify(pc.localDescription)) }));
                }
            }

            pc.onconnectionstatechange = () => {
                if (pc.connectionState == "closed" || pc.connectionState == "disconnected" || pc.connectionState == "failed") {
                    setAudioStream(null);
                    pc.close();
                    stopAllRecords();
                }
            }

            websocketConnection.onmessage = async (event) => {
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
            } catch (e) {
                console.log("Offer failed");
            }

        } else {
            console.log("Websockie gone")
        }
    }

    const handlePlay = () => {
        if (websocketConnection) {
            stopAllRecords();
            playRecord(id);
            setAudioStream(null);
            initializePeerConnection();
        }
    }

    const handleStop = () => {
        if (peerConnection?.connectionState == "connected") {
            peerConnection.close();
            setAudioStream(null);
            stopRecord(id);
        }
    }


    return <>
        <div className="flex gap-2 flex-row	">
            <button className="p-2 scale-175 flex" onClick={handlePlay} disabled={getPlayingRecord() != undefined && getPlayingRecord()?.id == id ? true : false}>
                <PlayButton disabled={getPlayingRecord() != undefined && getPlayingRecord()?.id == id ? true : false} />
            </button>
            <button className="p-2 scale-175 flex" onClick={handleStop} disabled={getPlayingRecord() != undefined && getPlayingRecord()?.id == id ? false : true}>
                <StopButton disabled={getPlayingRecord() != undefined && getPlayingRecord()?.id == id ? false : true} />
            </button>

            <audio ref={audioRef} autoPlay />
        </div>
    </>
}