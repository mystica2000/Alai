import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Mic from "@/icon/Mic";
import { useState } from "react";


export default function Record() {

    const [micOn, setMicOn] = useState(false);

    const handleMicOn = () => {
        setMicOn((prevMic) => !prevMic);
    }

    return <Card className="h-full flex flex-col">
        <CardHeader className="flex-none ">
            <CardTitle>Record Audio</CardTitle>
            <CardDescription>
                create audio recordings
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 grow">

            <div className="flex justify-center items-center h-full">
                <button onClick={() => handleMicOn()}>
                    <Mic micOn={micOn} />
                </button>
            </div>
        </CardContent>
        <CardFooter className="block grow-0 h-64">
            <h2>Logs:</h2>
            <div className="border-slate-800 border-2 p-3 mt-3 border-rounded border-radius-10 h-[13rem] rounded-lg overflow-y-auto">
            </div>
        </CardFooter>
    </Card>
}