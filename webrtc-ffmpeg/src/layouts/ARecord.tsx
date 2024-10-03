import DeleteButton from "@/icon/DeleteButton";
import EditButton from "@/icon/EditButton";
import ButtonControls from "./ButtonControls";
import { Record } from "@/hooks/useRecordState"

interface ARecordProps {
    record: Record;
}

export default function ARecord({ record }: ARecordProps) {

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
                <ButtonControls ID={record.id} />
                <span className="flex-grow border-t mt-3 mx-8"></span>
            </div>

        </li>
    )
}