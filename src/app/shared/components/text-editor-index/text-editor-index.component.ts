import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ConfirmationService, TreeNode } from 'primeng/api';
import { ProjectService } from '../../services/project.service';
import { BLOCK_TYPES } from '../../constants/BLOCK_TYPES.constants';
import { EditorService } from '../../services/editor.service';
import { OutputData, SavedData } from '@editorjs/editorjs/types/data-formats';
import { DataChangeEvent } from '../editor/models/DataChangeEvent.model';
import { API, BlockAddedEvent, BlockChangedEvent, BlockMovedEvent, BlockRemovedEvent } from '@editorjs/editorjs';

@Component({
  selector: 'app-text-editor-index',
  templateUrl: './text-editor-index.component.html',
  styleUrls: ['./text-editor-index.component.scss'],
  providers: []
})
export class TextEditorIndexComponent {
  _blocks: OutputData;
  @Input() set blocks(v: OutputData){
    this._blocks = v;
    this.index = [];
    this._blocks?.blocks.forEach( (b, i) => {
      if(b.type === 'header'){
        this.index.push({
          label: b.data.text?.replace(/<([^<]*)>|<(\/[^<]*)>/g, ''),
          data: { id: b.id! }
        });
      }
    })
  }

  @Output() nodeSelected: EventEmitter<string> = new EventEmitter();

  index: TreeNode<{ id: string }>[]= [];
  selected: TreeNode<any> | TreeNode<any>[] | null;

  constructor(private projectService: ProjectService, private editorService: EditorService) {
    this.projectService.onChange$.subscribe( _ => {
      this.index = [];
    });

    this.editorService.onChanges$.subscribe(this.computeChanges.bind(this));

  }

  async computeChanges({api, changes}: DataChangeEvent){
    changes.forEach( async (change) => {
      switch(change.type){
        case 'block-added': {
          change = change as BlockAddedEvent;
          if(change.detail.target.name === 'header'){
            const newBlockId = change.detail.target.id;
            const state = ((await api.blocks.getById(newBlockId)!.save()) as SavedData).data;
            const newBlockIndex = change.detail.index;
            for (let i = 0; i < this.index.length; i++) {
              const element = this.index[i];
              const elementIndex = api.blocks.getBlockIndex(element.data!.id);
              if(elementIndex >= newBlockIndex){
                this.index.splice(i, 0, this.createEntry(state.text, newBlockId));
                break;
              }
              if(i === this.index.length - 1){
                this.index.push(this.createEntry(state.text, newBlockId));
                break;
              }
            }
          }
          break;
        }
        case 'block-removed': {
          change = change as BlockRemovedEvent;
          if(change.detail.target.name === 'header'){
            const blockId = change.detail.target.id;
            const index = this.index.findIndex( block => block.data!.id === blockId );
            if(index > -1){
              this.index.splice(index, 1);
            }
          }
          break;
        }
        case 'block-changed': {
          change = change as BlockChangedEvent;
          if(change.detail.target.name === 'header'){
            const blockId = change.detail.target.id;
            const index = this.index.findIndex( block => block.data!.id === blockId );
            const state = ((await api.blocks.getById(blockId)!.save()) as SavedData).data;
            if(index > -1){
              this.index[index].label = this.extratText(state.text);
            }
          }
          break;
        }
        case 'block-moved': {
          change = change as BlockMovedEvent;
          const fromBlock = api.blocks.getBlockByIndex(change.detail.fromIndex);
          let headerBlock = fromBlock && fromBlock.name === 'header' ? fromBlock : null; 
          if(headerBlock){
            this.moveIndexEntry(headerBlock.id, api);
          }
          const toBlock = api.blocks.getBlockByIndex(change.detail.toIndex);
          headerBlock = toBlock && toBlock.name === 'header'  ? toBlock : null; 
          if(headerBlock){
            this.moveIndexEntry(headerBlock.id, api);
          }
          break;
        }
      }
    })
  }

  private moveIndexEntry(blockId: string, api: API){
    const blockIndex = api.blocks.getBlockIndex(blockId);
    const blockInIndexPos = this.index.findIndex( e => e.data!.id === blockId )!;
    const blockToMove = this.index[blockInIndexPos];
    this.index.splice(blockInIndexPos, 1);
    let isInserted = false;
    for (let i = 0; i < this.index.length; i++) {
      const element = this.index[i];
      const elementIndex = api.blocks.getBlockIndex(element.data!.id);
      if(elementIndex >= blockIndex){
        this.index.splice(i, 0, blockToMove);
        isInserted = true;
        break;
      }
    }
    if(!isInserted){
      this.index.push(blockToMove);
    }
  }

  private extratText(text: string){
    return text?.replace(/<([^<]*)>|<(\/[^<]*)>/g, '');
  }

  private createEntry(text: string, id: string){
    return {
      label: this.extratText(text),
      data: { id }
    }
  }

  onSelection(e){
    this.nodeSelected.emit(e.node.data.id);
  }

}
