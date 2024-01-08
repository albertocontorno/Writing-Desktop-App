import { EditorService } from './../../services/editor.service';
import { Component, Input, OnInit, Output, EventEmitter, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import EditorJS, { OutputData } from '@editorjs/editorjs';
import Header from '@editorjs/header'; 
import List from '@editorjs/list'; 
import { ReferenceTool } from './ReferenceTool/ReferenceTool';
import { HistoryPlugin } from './plugins/History/HistoryPlugin';
import { DataChangeEvent } from './models/DataChangeEvent.model';
import DragDrop from 'editorjs-drag-drop';
import { ProjectService } from '../../services/project.service';
@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements OnInit {
  @Input() id = 'editorjs';
  @Input() data: OutputData;
  @Input() pageId: string;

  @Output() editorReady: EventEmitter<EditorJS> = new EventEmitter();
  @Output() dataChanged: EventEmitter<DataChangeEvent> = new EventEmitter();

  editor: EditorJS;

  history: HistoryPlugin;
  @ViewChild('holder', {static: true}) holder: ElementRef;
  constructor(private editorService: EditorService, private projectService: ProjectService) { }

  ngOnInit(): void {
    
  }

  ngOnChanges(changes: SimpleChanges){
    if(changes.data && !changes.data.firstChange){
      console.log('data changed', changes.data)
      if(!changes.data.currentValue){
        this.editor.clear();
        this.history.init();
      } else {
        this.editor.render(changes.data.currentValue).then( _ => {
          this.holder.nativeElement.querySelectorAll('.ed-reference').forEach( ref => {
            ref.addEventListener('click', (e) => this.projectService.openReference$.next(e));
          });
        });
        const historyInfo = this.editorService.getHistory(changes.pageId?.currentValue);
        this.history.init(changes.data.currentValue, historyInfo?.currentIndex, historyInfo?.history);
      }
    }
  }

  ngAfterViewInit(){
    this.editor = new EditorJS({
      data: this.data,
      holder: this.id,
      tools: { 
        header: {
          class: Header,
          inlineToolbar: ['italic'/* , 'reference' */]
        },
        list: {
          class: List,
          inlineToolbar: ['bold', 'italic'/* , 'reference' */],
        },
        reference: {
          class: ReferenceTool,
          config: {
            getService: () => this.projectService
          }
        }
      },
      inlineToolbar: true,
      onChange: (api, changes) => {
        this.history.onChanges(api, changes);
        this.dataChanged.emit({
          api,
          changes: !Array.isArray(changes) ? [changes] : changes,
          history: this.history
        });
      },
      onReady: () => {
        this.history = new HistoryPlugin(this.editor, this.holder.nativeElement, this.data);
        this.editorService.setHistoryPlugin(this.history);
        new DragDrop(this.editor);
        this.holder.nativeElement.querySelectorAll('.ed-reference').forEach( ref => {
          ref.addEventListener('click', (e) => this.projectService.openReference$.next(e));
        });
        
        this.editorReady.emit(this.editor);
      }
    });
  }

  save(){
    this.editor.save().then((outputData) => {
      console.log('Article data: ', outputData);
    }).catch((error) => {
      console.error('Saving failed: ', error);
    });
  }

  ngOnDestroy(){
    this.history.destroy();
  }
}
