import { API, BlockMutationEvent } from "@editorjs/editorjs";

export interface DataChangeEvent{
  api: API;
  changes: BlockMutationEvent[]
}