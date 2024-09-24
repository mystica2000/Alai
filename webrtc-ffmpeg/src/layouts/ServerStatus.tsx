import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

type ServerState = "outline" | "secondary" | "destructive";

export default function ServerStatus() {

    const [serverState, setServerState] = useState<ServerState>("outline");

    const testServer = async () => {
        try {
            const fetchUrl = new URL('http://localhost:8080/server_test');
            const response = await fetch(fetchUrl.href);
            (await response.text());
            setServerState("secondary");
        } catch (error) {
            console.error(error);
            setServerState("destructive");
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