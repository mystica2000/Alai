import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import ServerLogs from "./ServerLogs";
import { useEffect, useState } from "react";
import ARecord from "./ARecord";

export default function Stream() {

    const [recordings, setRecordings] = useState<string[]>([]);

    const fetchRecordings = async () => {

        try {
            const fetchUrl = new URL('http://localhost:8080/recordings/');
            const result = await fetch(fetchUrl.href);
            const response = (await result.json());

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
        <CardContent className="space-y-2 grow overflow-auto border-solid border-neutral-100 border-2 rounded-md p-2 m-4 scrollbar-thin scrollbar-thumb-rounded scrollbar-track-black">
            <ul >
                {
                    recordings && recordings.map((aRecording) => (
                        <ARecord record={aRecording} />
                    ))
                }
            </ul>
        </CardContent>
        <CardFooter className="block grow-0 h-64">
            <ServerLogs />
        </CardFooter>
    </Card>
}