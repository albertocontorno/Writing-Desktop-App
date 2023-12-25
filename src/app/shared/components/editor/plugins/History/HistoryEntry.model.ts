import { BlockAPI } from "@editorjs/editorjs";

export class HistoryEntry {
  type: string;
  blockId: string;
  target: BlockAPI;
  index?: number;
  prevState?: any;
  currState?: any;
  toIndex?: number;
  fromIndex?: number;

  constructor(type: string, blockId: string, target: BlockAPI){
    this.type = type;
    this.blockId = blockId;
    this.target = target;
  }
}