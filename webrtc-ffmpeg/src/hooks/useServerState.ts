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

export type Record = {
    id: number;
    name: string;
    created_at: number
    isPlaying?: boolean
}

type RecordState = {
    records: Record[]
    allStopped: boolean
}

type RecordAction = {
    appendRecord: (newRecord: Omit<Record, "isPlaying">) => void
    appendRecords: (newRecords: Omit<Record, "isPlaying">[]) => void
    playRecord: (id: number) => void
    stopRecord: (id: number) => void
    stopAllRecords: () => void
    getPlayingRecord: () => Record | undefined
    updateRecord: (record: Record) => void
    deleteRecord: (id: number) => void
    setAllStopped: (value: boolean) => void;
}


export const usePlayStopState = create<RecordState & RecordAction>((set, get) => ({
    records: [],
    allStopped: false,
    setAllStopped: (value) => set({ allStopped: value }), // To reset the flag after handling

    appendRecord: (newRecord) =>
        set((prev) => ({
            records: [...prev.records, { ...newRecord, isPlaying: false }]
        })),

    appendRecords: (newRecords) =>
        set((state) => ({
            records: [
                ...state.records,
                ...newRecords.map((record) => ({
                    ...record,
                    isPlaying: false,
                }) as Record),  // Explicitly casting as Record
            ],
        })),

    playRecord: (id) => set((state) => ({
        records: state.records.map(record =>
            record.id === id ? { ...record, isPlaying: true } : { ...record, isPlaying: false }
        )
    })),

    stopRecord: (id) => set((state) => ({
        records: state.records.map(record =>
            record.id === id ? { ...record, isPlaying: false } : record
        ),
    })),

    stopAllRecords: () => set((state) => ({
        records: state.records.map(record => ({ ...record, isPlaying: false })),
        allStopped: true
    })),

    getPlayingRecord: () => get().records.find(record => record.isPlaying) || undefined,

    updateRecord: (updatedRecord) => set((state) => ({
        records: state.records.map(record =>
            record.id === updatedRecord.id ? updatedRecord : record
        )
    })),

    deleteRecord: (id) => set((state) => ({
        records: state.records.filter(record => record.id !== id)
    })),

}))