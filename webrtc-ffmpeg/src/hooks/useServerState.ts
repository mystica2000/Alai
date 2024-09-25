import { create } from "zustand";

export type LogObject = {
    text: string;
    type: "error" | "info" | "warning";
    id?: number;
}

type State = {
    log: LogObject[]
}

type Action = {
    addToLog: (log: LogObject) => void;
}

export const useServerState = create<State & Action>((set) => ({
    log: [],
    addToLog: (log: LogObject) => set((state) => {
        const next: State = {
            log: [
                ...state.log,
                { text: log.text, type: log.type, id: state.log.length }
            ]
        }

        return next;
    }),
    clearLogs: () => set(() => {
        const next: State = {
            log: []
        }
        return next;
    })
}))