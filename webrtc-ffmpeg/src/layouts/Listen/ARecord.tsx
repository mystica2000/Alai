import DeleteButton from "@/icon/DeleteButton";
import EditButton from "@/icon/EditButton";
import ButtonControls from "./ButtonControls";
import { Record } from "@/hooks/useRecordState"
import Scrubber from "./Scrubber";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { timeAgo } from "@/lib/utils";

interface ARecordProps {
    record: Record;
}

export default function ARecord({ record }: ARecordProps) {

    const [updateText, setUpdateText] = useState("");

    useEffect(() => {
        setUpdateText(timeAgo(record.created_at));
    }, [record])

    return (
        <li key={record.id} className="bg-slate-600 m-2 p-4 rounded-lg border-2 border-slate-900 bg-gradient-to-r from-blue-500 to-purple-600 pb-0" >
            <div className="flex justify-between">
                <div className="flex gap-3.5 items-baseline">
                    <span className="text-base grow text-white font-semibold mb-2">{record.name}</span>
                    <Badge className="border-0" variant={"secondary"}>{updateText}</Badge>
                </div>

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