import { EditorService } from './../../services/editor.service';
import { Component, Input, OnInit, Output, EventEmitter, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { DataChangeEvent } from './models/DataChangeEvent.model';
import { ProjectService } from '../../services/project.service';
import suneditor from 'suneditor'
import SunEditor from 'suneditor/src/lib/core';
import plugins from 'suneditor/src/plugins'
import * as eng from 'suneditor/src/lang/en';
import { getReferenceTool } from './plugins/History/ReferenceTool';
@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements OnInit {
  @Input() id = 'main-editor';
  @Input() data: any;
  @Input() pageId: string;
  @Input() maxHeightStyle: string = 'calc(100vh - 200px)';

  @Output() editorReady: EventEmitter<SunEditor> = new EventEmitter();
  @Output() dataChanged: EventEmitter<DataChangeEvent> = new EventEmitter();

  editor: SunEditor;

  @ViewChild('holder', {static: true}) holder: ElementRef;
  constructor(private editorService: EditorService, private projectService: ProjectService) { }

  ngOnInit(): void {
    
  }

  ngOnChanges(changes: SimpleChanges){
    if(changes.data && !changes.data.firstChange){
      if(!changes.data.currentValue){
        this.editor.setContents(changes.data.currentValue, true);
      } else {
        this.editor.setContents(changes.data.currentValue, true);
      }
      const prevHistory = this.editorService.getHistory(changes.pageId.currentValue);
      if(prevHistory){
        this.editor.core.history.setStack(prevHistory.stack);
        this.editor.core.history.setCurrentIndex(prevHistory.stackIndex);
      } else {
        this.editor?.core.history.reset(true);
      }
      this.editor?.core.history._resetCachingButton();
    }
    
  }

  ngAfterViewInit(){
    const _plugins = {
      ...plugins, 
      reference: getReferenceTool(this.projectService)
    };
    this.editor = suneditor.create(this.id, {
      // All of the plugins are loaded in the "window.SUNEDITOR" object in dist/suneditor.min.js file
      // Insert options
      // Language global object (default: en)
      defaultStyle: 'font-size: 14px; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; line-height: 1.42857143; color: #222; background-color: #ccc;',
      value: this.data,
      lang: eng as any,
      height: 'auto',
      plugins: _plugins,
      resizeEnable: true,
      /* resizingBarContainer: 'editor-tools-' + this.id, */
      stickyToolbar: '0px',
      attributesWhitelist: {'span':'de-reference'},
      toolbarContainer: 'editor-tools-' + this.id,
      buttonList: [
          [
            'undo', 'redo',
            'font', 'fontSize', 'formatBlock',
            'paragraphStyle', 'blockquote',
            'bold', 'underline', 'italic', 'strike', 'subscript', 'superscript',
            'fontColor', 'hiliteColor', 'textStyle',
            'removeFormat',
            'outdent', 'indent',
            'align', 'horizontalRule', 'list', 'lineHeight',
            'table', 'link', 'image', /* 'video', 'audio', */ /** 'math', */ // You must add the 'katex' library at options to use the 'math' plugin.
            /** 'imageGallery', */ // You must add the "imageGalleryUrl".
            'fullScreen', 'showBlocks', 'codeView',
            'preview', 'print', /* 'save' ,*/ /* 'template', */
            /** 'dir', 'dir_ltr', 'dir_rtl' */ // "dir": Toggle text direction, "dir_ltr": Right to Left, "dir_rtl": Left to Right
            'reference'
          ]
      ],
      width: 'auto',
      maxWidth: 'auto',
      maxHeight: 'calc(100vh - 200px)',
      minHeight: 'calc(100vh - 200px)',
      /* maxHeight: this.maxHeightStyle,
      minHeight: this.maxHeightStyle */
    });
    this.editor.onChange = (contents, core) => { 
      console.log('onChange', contents);
      this.dataChanged.emit(contents);
    };
    this.editor.onSave = (contents, core) => { 
      console.log('onSave', contents);
      (this.editor.core as any)._variable.isChanged = false;
    };
    this.editor.getContext().element.editorArea.addEventListener('click', (e) => {
      const t: HTMLElement = e.target as HTMLElement;
      const event: PointerEvent = e as PointerEvent;
      if(event.altKey &&t.attributes['de-reference']){
        this.projectService.openReference$.next(event);
      }
    });
    this.editorReady.emit(this.editor);
    
  }

  save(){
    
  }

  ngOnDestroy(){
    this.editor.destroy();
  }

  
}
