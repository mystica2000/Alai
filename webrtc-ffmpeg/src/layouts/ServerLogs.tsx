import { useServerState } from "@/hooks/useServerState";
import { useRef, useEffect } from "react";

export default function ServerLogs() {

    const logs = useServerState((state) => state.log);
    const dummy = useRef(null);

    useEffect(() => {
        if (dummy != null && dummy.current != null) {
            ((dummy.current as HTMLDivElement))?.scrollIntoView({ behavior: "instant", block: "end" });
        }

    }, [logs])

    return <>
        <h2>Logs:</h2>
        <div className="border-slate-800 border-2 p-3 mt-3 border-rounded border-radius-10 h-[13rem] rounded-lg overflow-y-auto">
            {
                logs.map((aLog) => <div key={aLog.id?.toString()} className={aLog.type == "error" ? "text-red-400" : "text-lime-300"}>{aLog.text}
                </div>)
            }
            <div ref={dummy} />
        </div>
    </>
}