import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { useServerState } from "@/hooks/useServerState";


type ServerState = "outline" | "secondary" | "destructive";

export default function ServerStatus() {

    const addToLog = useServerState((state) => state.addToLog);

    const [serverState, setServerState] = useState<ServerState>("outline");

    const testServer = async () => {
        try {
            const response = await fetch("/api/server_test");
            (await response.text());
            addToLog({ type: "info", text: "Server is Connected!" });
            setServerState("secondary");
        } catch (error) {
            console.error(error);
            setServerState("destructive");
            addToLog({ type: "error", text: "Server Connected Failed!" });
        }
    }

    //load posts on mount
    useEffect(() => {
        testServer();
    }, []);

    return <div className="mb-2 flex justify-end">
        <Badge variant={serverState} className={serverState == "secondary" ? "!bg-green-500" : ""}>Server Status</Badge>
    </div>
}