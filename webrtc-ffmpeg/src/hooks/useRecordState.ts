import { create } from "zustand";

export type Record = {
    id: number;
    name: string;
    created_at: number
    isPlaying?: boolean
    duration: number
    dataURI: string
}

type RecordState = {
    records: Record[]
    allStopped: boolean
}

type RecordAction = {
    appendRecord: (newRecord: Omit<Record, "isPlaying">) => void
    createRecords: (newRecords: Omit<Record, "isPlaying">[]) => void
    playRecord: (id: number) => void
    stopRecord: (id: number) => void
    stopAllRecords: () => void
    getPlayingRecord: () => Record | undefined
    updateRecord: (record: Record) => void
    deleteRecord: (id: number) => void
    setAllStopped: (value: boolean) => void;
}


export const useRecordState = create<RecordState & RecordAction>((set, get) => ({
    records: [],
    allStopped: false,
    setAllStopped: (value) => set({ allStopped: value }), // To reset the flag after handling

    appendRecord: (newRecord) =>
        set((prev) => ({
            records: [...prev.records, { ...newRecord, isPlaying: false }].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        })),

    createRecords: (newRecords) =>
        set(() => ({
            records: [
                ...newRecords.map((record) => ({
                    ...record,
                    isPlaying: false,
                }) as Record),  // Explicitly casting as Record
            ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
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