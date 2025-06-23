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
  _editor: any;
  @Input() set editor(v: SunEditor){
    this._editor = v;
    this.computeChanges();
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

  private computeChanges(){
    this.index = [];
    let current: TreeNode<{ id: string }>;
    this._editor?.getContext?.().element.editorArea.querySelectorAll('h1, h2').forEach( h1 => {
      if(h1.tagName === 'H1'){
        current = {
          label: this.extratText(h1.textContent),
          data: h1,
          children: [],
          expanded: true,
          expandedIcon: ''
        };
        this.index.push(current);
      } else if(h1.tagName === 'H2'){
        let h2 = {
          label: this.extratText(h1.textContent),
          data: h1,
          children: []
        };
        if(current){
          current.children!.push({
            label: this.extratText(h1.textContent),
            data: h1,
            children: []
          });
        } else {
          this.index.push(h2);
        }
      } else {
        this.index.push({
          label: this.extratText(h1.textContent),
          data: h1,
          children: []
        });
      }
    });
    this.cdRef.detectChanges();
  }

  private createIndex(){

  }
  private extratText(text: string){
    return text?.replace(/<([^<]*)>|<(\/[^<]*)>/g, '');
  }

  onSelection(e){
    this.nodeSelected.emit(e.node.data);
  }

}
