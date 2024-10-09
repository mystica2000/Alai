import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useRecordState } from "@/hooks/useRecordState";
import { Trash2, X } from "lucide-react";

interface ADeleteRecord {
    Id: number;
    Name: string;
}

export default function DeleteButton({ Id, Name }: ADeleteRecord) {
    const deleteRecord = useRecordState((state) => state.deleteRecord);

    const handleDelete = async () => {
        console.log("handle delete", Id);

        try {
            const fetchUrl = new URL('http://localhost:8080/recordings/' + Id);
            const result = await fetch(fetchUrl.href, {
                method: "DELETE",
            });
            (await result.text());
            deleteRecord(Id);
        } catch (error) {
            console.log(error);
        }
    }

    return <>

        <AlertDialog>
            <AlertDialogTrigger asChild>
                <button className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30">
                    <Trash2 className="text-white" size={20} />
                </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure to delete the recording - {Name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently the recording - {Name} and not recoverable.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
}