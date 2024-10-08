import DeleteButton from "@/icon/DeleteButton";
import EditButton from "@/icon/EditButton";
import ButtonControls from "./ButtonControls";
import { Record } from "@/hooks/useRecordState"
import Scrubber from "./Scrubber";

interface ARecordProps {
    record: Record;
}

export default function ARecord({ record }: ARecordProps) {

    return (
        <li key={record.id} className="bg-slate-600 m-2 p-4 rounded-lg border-2 border-slate-900 bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 pb-0" >
            <div className="flex ">
                <span className="grow">{record.name}</span>
                <div className="flex gap-3">
                    <EditButton Id={record.id} Name={record.name} />
                    <DeleteButton Id={record.id} Name={record.name} />
                </div>
            </div>
            <div className="flex justify-center w-full">
                <ButtonControls Id={record.id} />

                <span className="flex-grow mx-4 hidden sm:block">
                    <Scrubber Id={record.id} ImageUri={record.dataURI} Duration={record.duration} />
                </span>
            </div>

        </li>
    )
}