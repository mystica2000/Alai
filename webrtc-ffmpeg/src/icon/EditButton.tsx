import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRecordState } from "@/hooks/useRecordState";
import { Edit } from "lucide-react";
import { useState } from "react";
interface AEditRecordProps {
    Id: number;
    Name: string;
}

export default function EditButton({ Id, Name }: AEditRecordProps) {

    const [name, setName] = useState(Name);
    const updateRecord = useRecordState((state) => state.updateRecord);

    const handleEdit = async (e: any) => {
        if (Name !== name && name.length > 0) {
            // make call to backend
            // update record store
            const fetchUrl = new URL("http://localhost:8080/recordings/");

            try {
                await fetch(fetchUrl, {
                    method: "PUT",
                    body: JSON.stringify({ id: Id, name: name })
                });

                updateRecord(Id, name);

            } catch (err: unknown) {
                console.log(err);
            }
        }
    }

    const handleChange = (event: any) => {
        setName(event?.target.value)
    }

    return <>

        <Dialog>
            <DialogTrigger asChild>
                <button className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30">
                    <Edit className="text-white" size={20} />
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Recording - {Name}</DialogTitle>
                    <DialogDescription>
                        Make changes to your recording name here.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Name
                        </Label>
                        <Input id="name" value={name} className="col-span-3" onChange={(event) => handleChange(event)} />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="submit" onClick={handleEdit}>Save changes</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </>
}