import { useRecordState } from "@/hooks/useRecordState";
import useWebSocketStore from "@/hooks/useWebsocket";
import PlayButton from "@/icon/PlayButton";
import StopButton from "@/icon/StopButton";

interface ARecordProps {
    ID: number;
}

export default function ButtonControls({ ID }: ARecordProps) {
    const { playRecord, stopAllRecords, getPlayingRecord } = useRecordState();
    const { sendMessage } = useWebSocketStore()
    const setAllStopped = useRecordState((state) => state.setAllStopped);

    const handlePlay = () => {
        stopAllRecords();
        playRecord(ID);
        sendMessage({ msg: "play", type: "command", option: "command", payload: ID });
    }

    const handleStop = () => {
        setAllStopped(true);
        stopAllRecords();
        sendMessage({ msg: "stop", type: "command", option: "command", payload: ID });
    }


    return <>
        <div className="flex gap-2 flex-row	">
            <button className="p-2 scale-175 flex" onClick={handlePlay} disabled={getPlayingRecord() != undefined && getPlayingRecord()?.id == ID ? true : false}>
                <PlayButton disabled={getPlayingRecord() != undefined && getPlayingRecord()?.id == ID ? true : false} />
            </button>
            <button className="p-2 scale-175 flex" onClick={handleStop} disabled={getPlayingRecord() != undefined && getPlayingRecord()?.id == ID ? false : true}>
                <StopButton disabled={getPlayingRecord() != undefined && getPlayingRecord()?.id == ID ? false : true} />
            </button>
        </div>
    </>
}