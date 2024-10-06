import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import ServerLogs from "../ServerLogs";
import RecordList from "./RecordList";

export default function Stream() {

    return <>
        <Card className="h-full flex flex-col">
            <CardHeader className="flex-none">
                <CardTitle>View Recordings</CardTitle>
                <CardDescription>
                    contains Recordings list
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 grow overflow-auto border-solid border-neutral-100 border-2 rounded-md p-2 m-4 scrollbar-thin scrollbar-thumb-rounded scrollbar-track-black">
                <RecordList />
            </CardContent>
            <CardFooter className="block grow-0 h-64">
                <ServerLogs />
            </CardFooter>
        </Card>
    </>
}