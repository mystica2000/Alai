import { useRef, useState, useEffect } from "react";
import ARecord from "./ARecord";
import { usePlayStopState } from "@/hooks/useServerState";



export default function Stream() {


    const renderAfterCalled = useRef(false)

    const [ws, setWs] = useState<WebSocket | undefined>();
    const { appendRecords, records } = usePlayStopState();

    const fetchRecordings = async () => {
        try {
            const fetchUrl = new URL('http://localhost:8080/recordings/');
            const result = await fetch(fetchUrl.href);
            const response = (await result.json());

            appendRecords(JSON.parse(atob(response.recordings)));
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {

        if (!renderAfterCalled.current) {
            fetchRecordings();
        }

        renderAfterCalled.current = true;

        initWs();
    }, []);

    const initWs = async () => {
        const ws = await startWS();

        setWs(ws);
    }

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

    return <ul >
        {
            records && records.map((aRecording) => (
                <ARecord record={aRecording} key={aRecording.id} websocketConnection={ws} />
            ))
        }
    </ul>
}
