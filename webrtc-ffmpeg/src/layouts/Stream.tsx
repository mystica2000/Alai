import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import ServerLogs from "./ServerLogs";
import { useEffect, useState } from "react";

export default function Stream() {

    const [recordings, setRecordings] = useState<String[]>([]);

    const fetchRecordings = async () => {

        try {
            const fetchUrl = new URL('http://localhost:8080/recordings/');
            const result = await fetch(fetchUrl.href);
            const response = (await result.json());
            console.log(response.recordings);

            setRecordings(response.recordings);
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        fetchRecordings();
    }, []);

    return <Card className="h-full flex flex-col">
        <CardHeader className="flex-none">
            <CardTitle>View Recordings</CardTitle>
            <CardDescription>
                contains Recordings list
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 grow overflow-auto border-solid border-neutral-100 border-2 rounded-md p-2 m-4">
            <section className="">
                {
                    recordings && recordings.map((aRecording) => (
                        <div className="flex">
                            <span className="grow">{aRecording}</span>
                            <div className="flex gap-3">
                                <button className="rounded-md border-solid border-slate-400 border-2 m-1 p-1">play</button>
                                <button className="rounded-md border-solid border-slate-400 border-2 m-1 p-1">delete</button>
                            </div>
                        </div>
                    ))
                }
            </section>
        </CardContent>
        <CardFooter className="block grow-0 h-64">
            <ServerLogs />
        </CardFooter>
    </Card>
}