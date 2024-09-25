import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import MicButton from "@/icon/MicButton";
import ServerLogs from "./ServerLogs";


export default function Record() {


    return <Card className="h-full flex flex-col">
        <CardHeader className="flex-none">
            <CardTitle>Record Audio</CardTitle>
            <CardDescription>
                create audio recordings
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 grow">
            <div className="flex justify-center items-center h-full">
                <MicButton />
            </div>
        </CardContent>
        <CardFooter className="block grow-0 h-64">
            <ServerLogs />
        </CardFooter>
    </Card>
}