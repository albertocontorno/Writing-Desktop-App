import EditorJS, { OutputData } from '@editorjs/editorjs';
import { Component, ViewChild } from '@angular/core';
import { ProjectService } from '../../services/project.service';
import { Project, ProjectFile, ProjectNote } from '../../models/project.model';
import { EditorService } from '../../services/editor.service';
import { DataChangeEvent } from '../editor/models/DataChangeEvent.model';
import { HistoryChacheEntry } from '../../models/internals/HistoryCache.model';
import { generateUUID } from '../../utils/utils';
import { HierarchyMenuService } from '../hierarchy-menu/hierarchy-menu.service';

interface OpenedPage {
  id: string,
  path: string,
  name: string,
  data: OutputData,
  history?: HistoryChacheEntry,
  hasChanges: boolean;
}

@Component({
  selector: 'app-writing-desktop',
  templateUrl: './writing-desktop.component.html',
  styleUrls: ['./writing-desktop.component.scss']
})
export class WritingDesktopComponent {
  JSON = JSON;
  generateUUID = generateUUID;
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
        if(this.currentOpenedPage){
          this.currentOpenedPage.hasChanges = false;
          this.mainEditor.save().then( (data) => {
            const payload = {
              id: this.currentOpenedPage!.id,
              ...data,
            };
            this.projectService.saveFile(this.currentOpenedPage!.path, payload).subscribe( res => {
              console.log('File', this.currentOpenedPage!.path, 'saved', res);
            })
          } );
        }
      }
    },
    {
      label: 'Add Note',
      command: () => {
        this.openCreateNote();
      }
    }
  ]
  isReferenceChooseVisible;
  selectedReference;
  currentReference;

  noteData: { visible: boolean, editor?: EditorJS, note?: ProjectNote } = { visible: false, editor: undefined, note: undefined };

  openedFilesMaps: {[key: string]: OpenedPage} = {};
  hierarchyMenuService: HierarchyMenuService;
  @ViewChild('referenceOP') referenceOP;
  constructor(private projectService: ProjectService, private editorService: EditorService){
    this.projectService.onChange$.subscribe( changes => {
      this.project = changes.project!;
    });
    this.projectService.chooseReference$.subscribe( isOpen => {
      this.isReferenceChooseVisible = isOpen;
    });
    this.projectService.openReference$.subscribe( e => {
      this.openReference(e);
    });
  }

  onHierarchyMenuInit(hierarchyMenuService: HierarchyMenuService){
    this.hierarchyMenuService = hierarchyMenuService;
  }

  onEditorDataChange(changes: DataChangeEvent){
    this.editorService.onChanges$.next(changes);
    if(this.currentOpenedPage){
      setTimeout( () =>{ this.currentOpenedPage!.hasChanges = changes.history.currentIndex > -1 }, 50);
    }
  }

  async openItem(item){
    const fileInTabs = this.openedFiles.find( f => f.id === item.id );
    if(fileInTabs){
      this.currentOpenedPage = this.openedFilesMaps[fileInTabs.id];
      return;
    }
    const file: any = {
      id: item.id,
      path: item.path,
      name: item.name,
      data: undefined,
      hasChanges: false
    }
    this.openedFiles.push(file);
    this.projectService.readFile(item.path).subscribe(
      res => {
        console.log(res);
        const data =  res ? JSON.parse(res) : null;
        file.data = data;
        this.openedFilesMaps[item.id] = file
        /* this.openedFilesMaps[item.id] = {
          id: item.id,
          path: item.path,
          name: item.name,
          data: data,
          hasChanges: false
        }; */
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
    console.log('reference selected', reference)
    this.selectedReference = reference;
  }

  selectReference(){
    this.projectService.referenceSelected$.next(this.selectedReference);
    this.selectedReference = undefined;
    this.isReferenceChooseVisible = false;
  }

  openReference(event){
    // get REFERENCE
    /* this.currentReference = this.hierarchyMenuService.getFileItemFromIndex(reference.path)?.item;
    this.referenceOP.toggle(); */
    /* const context = JSON.parse(target.currentTarget.attributes['ed-data-context'].nodeValue); */
    const referencePath = event.currentTarget.attributes['ed-data-context'].nodeValue;
    // get REFERENCE
    const item = this.hierarchyMenuService.getFileItemFromIndex(referencePath)?.item;
    this.projectService.readFile(item.path).subscribe( res => {
      this.currentReference = JSON.parse(res);
      this.currentReference.name = item.name;
      this.referenceOP.toggle(event);
    });
  }

  openCreateNote(){
    this.noteData.visible = true;
    this.noteData.note = {id: generateUUID(), title: 'New Note Title', position: this.project.notes?.length || 0};
  }

  onNoteEditorReady(editor: EditorJS){
    this.noteData.editor = editor;
  }

  createNote(note: ProjectNote){
    this.projectService.createNote(
      {
        id: note.id,
        title: note.title,
        position: this.project.notes?.length,
      },
      note.data
    ).subscribe(
      res => {
        console.log('note created', res)
        this.closeCreateNote();
      }
    )
  }

  closeCreateNote(){
    this.noteData.visible = false;
    this.noteData.note = undefined;
    this.noteData.editor = undefined;
  }

  removeCurrentFile(files){
    return files;
  }

  ngOnDestroy(){

  }

}
