import { API, BlockMutationEvent } from "@editorjs/editorjs";
import { HistoryPlugin } from "../plugins/History/HistoryPlugin";

export interface DataChangeEvent{
  api: API;
  changes: BlockMutationEvent[],
  history: HistoryPlugin
}