import DeleteButton from "@/icon/DeleteButton";
import EditButton from "@/icon/EditButton";
import PlayButton from "@/icon/PlayButton";
import { Record } from "@/lib/types";

interface ARecordProps {
    record: Record;
}

export default function ARecord({ record }: ARecordProps) {

    return (
        <li key={record.id} className="flex bg-slate-600 m-2 p-4 rounded-lg border-2 border-slate-900" >
            <span className="grow">{record.name}</span>
            <div className="flex gap-3">
                <EditButton />
                <PlayButton />
                <DeleteButton />
            </div>
        </li>
    )
}