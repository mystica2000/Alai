import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRecordState } from "@/hooks/useRecordState";
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
                <button className="p-1 scale-125">
                    <svg xmlns="http://www.w3.org/2000/svg" className="ionicon w-4 scale-125" viewBox="0 0 512 512" fill="white">
                        <path d="M459.94 53.25a16.06 16.06 0 00-23.22-.56L424.35 65a8 8 0 000 11.31l11.34 11.32a8 8 0 0011.34 0l12.06-12c6.1-6.09 6.67-16.01.85-22.38zM399.34 90L218.82 270.2a9 9 0 00-2.31 3.93L208.16 299a3.91 3.91 0 004.86 4.86l24.85-8.35a9 9 0 003.93-2.31L422 112.66a9 9 0 000-12.66l-9.95-10a9 9 0 00-12.71 0z" />
                        <path d="M386.34 193.66L264.45 315.79A41.08 41.08 0 01247.58 326l-25.9 8.67a35.92 35.92 0 01-44.33-44.33l8.67-25.9a41.08 41.08 0 0110.19-16.87l122.13-121.91a8 8 0 00-5.65-13.66H104a56 56 0 00-56 56v240a56 56 0 0056 56h240a56 56 0 0056-56V199.31a8 8 0 00-13.66-5.65z" />
                    </svg>
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