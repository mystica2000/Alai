import DeleteButton from "@/icon/DeleteButton";
import EditButton from "@/icon/EditButton";
import ButtonControls from "./ButtonControls";
import { Record } from "@/hooks/useServerState";

interface ARecordProps {
    record: Record;
    websocketConnection: WebSocket | undefined
}

export default function ARecord({ record, websocketConnection }: ARecordProps) {

    return (
        <li key={record.id} className="bg-slate-600 m-2 p-4 rounded-lg border-2 border-slate-900 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" >
            <div className="flex ">
                <span className="grow">{record.name}</span>
                <div className="flex gap-3">
                    <EditButton />
                    <DeleteButton />
                </div>
            </div>
            <div className="flex justify-center w-full mt-4">
                <ButtonControls websocketConnection={websocketConnection} id={record.id} />
                <span className="flex-grow border-t mt-3 mx-8"></span>
            </div>

        </li>
    )
}