import { useRecordState } from "@/hooks/useRecordState";
import useWebSocketStore from "@/hooks/useWebsocket";
import PlayButton from "@/icon/PlayButton";
import StopButton from "@/icon/StopButton";

interface ARecordProps {
    Id: number;
}

export default function ButtonControls({ Id }: ARecordProps) {
    const { playRecord, stopAllRecords, getPlayingRecord } = useRecordState();
    const { sendMessage, closePeerConnection, setCurrentTask } = useWebSocketStore()
    const setAllStopped = useRecordState((state) => state.setAllStopped);

    const handlePlay = () => {
        stopAllRecords();
        playRecord(Id);
        sendMessage({ command: "play", data: {}, payload: Id });
    }

    const handleStop = () => {
        setAllStopped(true);
        stopAllRecords();
        sendMessage({ command: "stop", data: {}, payload: Id });
        closePeerConnection();
        setCurrentTask("");
    }


    return <>
        <div className="flex gap-2 flex-row	items-center">
            <button className="flex" onClick={handlePlay} disabled={getPlayingRecord() != undefined && getPlayingRecord()?.id == Id ? true : false}>
                <PlayButton disabled={getPlayingRecord() != undefined && getPlayingRecord()?.id == Id ? true : false} />
            </button>
            <button className="flex" onClick={handleStop} disabled={getPlayingRecord() != undefined && getPlayingRecord()?.id == Id ? false : true}>
                <StopButton disabled={getPlayingRecord() != undefined && getPlayingRecord()?.id == Id ? false : true} />
            </button>
        </div>
    </>
}