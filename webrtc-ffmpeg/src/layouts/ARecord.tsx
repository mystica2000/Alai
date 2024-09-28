import DeleteButton from "@/icon/DeleteButton";
import PlayButton from "@/icon/PlayButton";

interface ARecordProps {
    record: string;
}


export default function ARecord({ record }: ARecordProps) {
    return (
        <li className="flex bg-slate-600 m-2 p-4 rounded-lg border-2 border-slate-900">
            <span className="grow">{record}</span>
            <div className="flex gap-3">
                <PlayButton />
                <DeleteButton />
            </div>
        </li>
    )
}