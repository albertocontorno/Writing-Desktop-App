import { HistoryEntry } from "../../components/editor/plugins/History/HistoryEntry.model";

export declare type HistoryChacheEntry = {currentIndex: number, history: HistoryEntry[]};
export declare type HistoryCachedEMap= {[key: string] : HistoryChacheEntry};
