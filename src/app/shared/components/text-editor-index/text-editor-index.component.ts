import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { ConfirmationService, TreeNode } from 'primeng/api';
import { ProjectService } from '../../services/project.service';
import { BLOCK_TYPES } from '../../constants/BLOCK_TYPES.constants';
import { EditorService } from '../../services/editor.service';
import { DataChangeEvent } from '../editor/models/DataChangeEvent.model';
import SunEditor from 'suneditor/src/lib/core';

@Component({
  selector: 'app-text-editor-index',
  templateUrl: './text-editor-index.component.html',
  styleUrls: ['./text-editor-index.component.scss'],
  providers: []
})
export class TextEditorIndexComponent {
  _blocks: any;
  @Input() set blocks(v: SunEditor){
    this._blocks = v;
    this.index = [];
    if(v){
      v.getContext().element.editorArea.querySelectorAll('h1').forEach( h1 => {
        this.index.push({
          label: h1.textContent?.replace(/<([^<]*)>|<(\/[^<]*)>/g, ''),
          data: h1
        });
      });
      this.cdRef.markForCheck();
    }
  }

  @Output() nodeSelected: EventEmitter<string> = new EventEmitter();

  index: TreeNode<{ id: string }>[]= [];
  selected: TreeNode<any> | TreeNode<any>[] | null;

  constructor(private projectService: ProjectService, private editorService: EditorService, private cdRef: ChangeDetectorRef) {
    this.projectService.onChange$.subscribe( _ => {
      this.index = [];
    });

    this.editorService.onChanges$.subscribe(this.computeChanges.bind(this));

  }

  async computeChanges({api, changes}: any){
    if(this._blocks?.getContext){
      this.index = [];
      this._blocks.getContext().element.editorArea.querySelectorAll('h1').forEach( h1 => {
        this.index.push({
          label: h1.textContent?.replace(/<([^<]*)>|<(\/[^<]*)>/g, ''),
          data: h1
        });
      });
    }
  }

  private moveIndexEntry(blockId: string, api: any){
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
    this.nodeSelected.emit(e.node.data);
  }

}
