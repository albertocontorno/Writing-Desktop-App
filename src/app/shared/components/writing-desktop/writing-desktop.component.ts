import EditorJS, { BlockMutationEvent, OutputData } from '@editorjs/editorjs';
import { Component, Input } from '@angular/core';
import { ProjectService } from '../../services/project.service';
import { Project, ProjectFile } from '../../models/project.model';
import { EditorService } from '../../services/editor.service';
import { DataChangeEvent } from '../editor/models/DataChangeEvent.model';
import { HistoryChacheEntry } from '../../models/internals/HistoryCache.model';

interface OpenedPage {
  id: string,
  path: string,
  name: string,
  data: OutputData,
  history?: HistoryChacheEntry
}

@Component({
  selector: 'app-writing-desktop',
  templateUrl: './writing-desktop.component.html',
  styleUrls: ['./writing-desktop.component.scss']
})
export class WritingDesktopComponent {
  JSON = JSON;
  project: Project;
  openedFiles: any[] = [];
  currentOpenedPageIndex: number = -1;

  _currentOpenedPage?: OpenedPage;
  set currentOpenedPage(value: OpenedPage | undefined){
    this._currentOpenedPage = value;
    if(value){
      this.currentOpenedPageIndex = this.openedFiles.findIndex( f => f.id === value.id );
    }
  }
  get currentOpenedPage(): OpenedPage | undefined{
    return this._currentOpenedPage;
  };
  mainEditor: EditorJS;
  editorMenu = [
    {
      label: 'Save',
      command: () => {
        console.log(this.currentOpenedPage);
        this.mainEditor.save().then( (data) => {
          this.projectService.saveFile(this.currentOpenedPage!.path, data).subscribe( res => {
            console.log('File', this.currentOpenedPage!.path, 'saved', res);
          })
        } );
      }
    },
    {
      label: 'Add Note',
      command: () => {
        /* this.openCreateNote(); */
      }
    }
  ]
  isReferenceChooseVisible;
  selectedReference;
  currentReference;
  isNoteCreationVisible;
  newNote;

  openedFilesMaps: {[key: string]: OpenedPage} = {};

  constructor(private projectService: ProjectService, private editorService: EditorService){
    this.projectService.onChange$.subscribe( changes => {
      this.project = changes.project!;
    });
  }

  onHierarchyMenuInit(menu){

  }

  onEditorDataChange(changes: DataChangeEvent){
    this.editorService.onChanges$.next(changes);
  }

  async openItem(item){
    const fileInTabs = this.openedFiles.find( f => f.id === item.id );
    if(fileInTabs){
      this.currentOpenedPage = this.openedFilesMaps[fileInTabs.id];
      return;
    }
    this.openedFiles.push(item);
    this.projectService.readFile(item.path).subscribe(
      res => {
        console.log(res);
        const data =  res ? JSON.parse(res) : null;
        this.openedFilesMaps[item.id] = {
          id: item.id,
          path: item.path,
          name: item.name,
          data: data
        };
        this.openFile({tab: this.openedFilesMaps[item.id]});
      }
    );
  }

  onItemDeleted(item: ProjectFile){
    this.closeFile({tab: item as any});
  }

  onNodeSelected(node){
    console.log(node);
    const element = document.querySelector(`[data-id="${node}"]`);

    element?.scrollIntoView({behavior: 'smooth'});
  }

  closeFile({tab: item}: {tab: OpenedPage}){
    const itemIndex = this.openedFiles.findIndex( f => f === item);
    this.openedFiles.splice(itemIndex, 1);
    if(this.openedFiles.length === 0){
      this.currentOpenedPage = undefined;
    }
    if(this.currentOpenedPage === this.openedFilesMaps[item.id]){
      if(itemIndex < this.openedFiles.length - 1){
        this.currentOpenedPage = this.openedFilesMaps[this.openedFiles[itemIndex].id];
      } else {
        this.currentOpenedPage = this.openedFilesMaps[this.openedFiles[this.openedFiles.length-1].id];
      }
    }
    this.editorService.deleteHistory(item.id);
    delete this.openedFilesMaps[item.id];
  }

  async openFile({tab: item}: {tab: OpenedPage}){
    if(this.currentOpenedPage){
      if(this.currentOpenedPage.id === item.id){
        return;
      }
      let editorData = await this.mainEditor.save();
      this.editorService.addHistory(this.currentOpenedPage.id, this.editorService.history.getCurrentState());
      this.currentOpenedPage.data = editorData;
      this.currentOpenedPage.history = this.editorService.getHistory(item.id);
    }
    this.currentOpenedPage = this.openedFilesMaps[item.id];
  }

  onMainEditorReady(editor: EditorJS){
    this.mainEditor = editor;
  }

  onReferenceSelected(reference){
    
  }

  selectReference(){

  }

  createNote(){

  }

  closeCreateNote(){

  }

  ngOnDestroy(){

  }

}
