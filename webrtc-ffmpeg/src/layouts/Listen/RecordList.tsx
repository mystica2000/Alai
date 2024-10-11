import { useRef, useEffect } from "react";
import ARecord from "./ARecord";
import { useRecordState } from "@/hooks/useRecordState";
import useWebSocketStore from "@/hooks/useWebsocket";



export default function Stream() {


    const audioRef = useRef<HTMLAudioElement | null>(null);
    const renderAfterCalled = useRef(false)
    const allStopped = useRecordState((state) => state.allStopped);
    const { createRecords, records } = useRecordState();

    const setAllStopped = useRecordState((state) => state.setAllStopped);

    const { audioStream } = useWebSocketStore()

    const fetchRecordings = async () => {
        try {
            const result = await fetch("/api/recordings/");
            const response = (await result.json());

            createRecords(JSON.parse(atob(response.recordings)));
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {

        if (!renderAfterCalled.current) {
            fetchRecordings();
        }

        renderAfterCalled.current = true;

    }, []);


    useEffect(() => {

        if (allStopped) {
            setAllStopped(false);

            if (audioRef.current) {
                audioRef.current.srcObject = null;
                audioRef.current.currentTime = 0;
                audioRef.current.pause();
            }
        }

    }, [allStopped])

    useEffect(() => {
        if (audioRef.current && audioStream) {
            audioRef.current.srcObject = audioStream
            audioRef.current.play().catch(e => console.error("Error playing audio:", e));
        }

    }, [audioStream]);

    return <>
        <ul >
            {
                records && records.map((aRecording) => (
                    <ARecord record={aRecording} key={aRecording.id} />
                ))
            }
        </ul>
        <audio ref={audioRef} autoPlay />
    </>
}
