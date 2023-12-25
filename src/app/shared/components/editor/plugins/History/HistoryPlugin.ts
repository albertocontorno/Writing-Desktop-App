import EditorJS, { API, BlockAddedEvent, BlockChangedEvent, BlockMovedEvent, BlockMutationEvent, BlockRemovedEvent, OutputData } from '@editorjs/editorjs';
import { SavedData } from '@editorjs/editorjs/types/data-formats';
import { HistoryEntry } from './HistoryEntry.model';

export class HistoryPlugin{
  history: HistoryEntry[] = [];

  currentIndex: number = -1;

  private isUndoingOrRedoing = false;
  /**
   * A map to keep trace of the previous data of a block
   */
  private blockToPrevState: {[key: string]: any} = {};

  holder: HTMLElement;

  constructor(private editor: EditorJS, holderElement: HTMLElement | string, initialState?: OutputData){
    if(typeof holderElement === 'string'){
      const holder = document.getElementById(holderElement);
      if(!holder){
        throw new Error('[HistoryPlugin] Holder element not found');
      } else {
        this.holder = document.getElementById(holderElement)!;
      }
    } else {
      this.holder = holderElement;
    }
    this.init(initialState);
    this.holder.addEventListener('keydown', this.keydownEventListener);
  }

  private keydownEventListener = (e) => {
    if (e.ctrlKey && (e.key === 'z' || e.key === 'Z')) {
      this.undo(e);
    } else if (e.ctrlKey && (e.key === 'y' || e.key === 'Y')) {
      this.redo(e);
    }
  }

  init(initialState?: OutputData, currentIndex: number = -1, history: HistoryEntry[] = []){
    this.history = history;
    this.blockToPrevState = {};
    this.currentIndex = currentIndex;
    if(initialState){
      this.setInitialState(initialState);
    }
  }

  private setInitialState(initialState: OutputData){
    initialState.blocks.forEach( block => {
      this.blockToPrevState[block.id!] = block.data;
    });
  }


  onChanges(api: API, events: BlockMutationEvent | BlockMutationEvent[]){
    if(Array.isArray(events)){
      events.forEach( event => {
        this.processEvent(api, event);
      });
    } else {
      this.processEvent(api, events);
    }
  }

  private async processEvent(api: API, event: BlockAddedEvent | BlockRemovedEvent | BlockMovedEvent | BlockChangedEvent) {
    if(this.isUndoingOrRedoing){ 
      this.isUndoingOrRedoing = false;
      // TODO improve this.blockToPrevState to keep it cleaner removing not existent entries
      /* switch(event.type){
        case 'block-added':{}
        case 'block-removed':{}
        case 'block-changed':{}
        case 'block-moved':{}
      } */
      return; 
    }
    this.history.slice(this.currentIndex).forEach( change => {
      if(change.type === 'block-removed'){
        delete this.blockToPrevState[change.blockId];
      }
    });
    this.history = this.history.slice(0, this.currentIndex+1);
    const newEntry: HistoryEntry = new HistoryEntry(
      event.type,
      event.detail.target.id,
      event.detail.target
    );
    switch(event.type){
      case 'block-added':{
        event = event as BlockAddedEvent;
        const state = ((await api.blocks.getById(newEntry.blockId)!.save()) as SavedData).data;
        newEntry.index = event.detail.index;
        newEntry.currState = state;
        this.history.push(newEntry);
        this.blockToPrevState[newEntry.blockId] = {text: ""};
        break;
      }
      case 'block-removed':{
        event = event as BlockRemovedEvent;
        newEntry.prevState = this.blockToPrevState[newEntry.blockId];
        newEntry.index = event.detail.index;
        this.history.push(newEntry);
        break;
      }
      case 'block-changed':{
        event = event as BlockChangedEvent;
        const state = ((await api.blocks.getById(newEntry.blockId)!.save()) as SavedData).data;
        newEntry.currState = state;
        newEntry.prevState = this.blockToPrevState[newEntry.blockId];
        newEntry.index = event.detail.index;
        this.history.push(newEntry);
        this.blockToPrevState[newEntry.blockId] = state;
        break;
      }
      case 'block-moved':{
        event = event as BlockMovedEvent;
        newEntry.fromIndex = event.detail.fromIndex;
        newEntry.toIndex = event.detail.toIndex;
        this.history.push(newEntry);
        break;
      }
    }
    this.currentIndex++;
  }
  
  undo(e){
    e.preventDefault();
    if(this.isUndoingOrRedoing){
      return;
    }
    if(this.currentIndex === -1){
      return;
    }
    
    this.isUndoingOrRedoing = true;
    const toUndo = this.history[this.currentIndex];

    switch(toUndo.type){
      case 'block-added':{
        this.editor.blocks.delete(toUndo.index);
        this.editor.caret.setToBlock(toUndo.index! - 1, 'end');
        break;
      }
      case 'block-removed':{
        const blockToAdd = toUndo.target;
        this.editor.blocks.insert(blockToAdd.name, toUndo.prevState, blockToAdd.config, toUndo.index, true, false, toUndo.blockId);
        this.editor.caret.setToBlock(this.editor.blocks.getCurrentBlockIndex(), 'end');
        this.blockToPrevState[toUndo.blockId] = toUndo.prevState;
        break;
      }
      case 'block-changed':{
        /* this.editor.blocks.update(toUndo.blockId, toUndo.prevState)
          .then( updatedBlock => setTimeout( () => this.restoreSelection(toUndo, updatedBlock) , 50) ); */
        this.editor.blocks.update(toUndo.blockId, toUndo.prevState)
          .then( updatedBlock => setTimeout( () => this.editor.caret.setToBlock(this.editor.blocks.getBlockIndex(updatedBlock.id)) ));
        this.blockToPrevState[toUndo.blockId] = toUndo.prevState;
        break;
      }
      case 'block-moved':{
        this.editor.blocks.move(toUndo.toIndex!, toUndo.fromIndex!);
        this.editor.caret.setToBlock(toUndo.fromIndex!);
        break;
      }
    }
    
    this.currentIndex--;
  }

  redo(e){
    e.preventDefault();
    if(this.isUndoingOrRedoing){
      return;
    }
    if(this.currentIndex+1 >= this.history.length){
      this.currentIndex = this.history.length - 1;
      return;
    }
    this.currentIndex++;
    
    this.isUndoingOrRedoing = true;
    const toRedo = this.history[this.currentIndex];
    switch(toRedo.type){
      case 'block-added':{
        const blockToAdd = toRedo.target;
        this.editor.blocks.insert(blockToAdd.name, toRedo.prevState, blockToAdd.config, toRedo.index, true, false, toRedo.blockId)
        this.editor.caret.setToBlock(toRedo.index!, 'end');
        this.blockToPrevState[toRedo.blockId] = toRedo.prevState;
        break;
      }
      case 'block-removed':{
        this.editor.blocks.delete(toRedo.index);
        this.editor.caret.setToBlock(toRedo.index! - 1, 'end');
        break;
      }
      case 'block-changed':{
        /* this.editor.blocks.update(toRedo.blockId, toRedo.currState)
          .then( updatedBlock => setTimeout( () => this.restoreSelection(toRedo, updatedBlock) , 50) ); */
        this.editor.blocks.update(toRedo.blockId, toRedo.currState)
          .then( updatedBlock => setTimeout( () => this.editor.caret.setToBlock(this.editor.blocks.getBlockIndex(updatedBlock.id)) ));
        this.blockToPrevState[toRedo.blockId] = toRedo.currState;
        break;
      }
      case 'block-moved':{
        this.editor.blocks.move(toRedo.toIndex!, toRedo.fromIndex!);
        this.editor.caret.setToBlock(toRedo.toIndex!);
        break;
      }
    }
  }

  getCurrentState(){
    return {
      currentIndex: this.currentIndex,
      history: this.history
    }
  }

  destroy(){
    this.holder.removeEventListener('keydown', this.keydownEventListener);
  }
}