import { Component, ViewChild } from '@angular/core';
import { ProjectService } from '../../services/project.service';
import { Project, ProjectFile, ProjectNote } from '../../models/project.model';
import { EditorService } from '../../services/editor.service';
import { DataChangeEvent } from '../editor/models/DataChangeEvent.model';
import { HistoryChacheEntry } from '../../models/internals/HistoryCache.model';
import { generateUUID } from '../../utils/utils';
import { HierarchyMenuService } from '../hierarchy-menu/hierarchy-menu.service';
import SunEditor from 'suneditor/src/lib/core';
import { MenuItem, PrimeIcons } from 'primeng/api';

interface OpenedPage {
  id: string,
  path: string,
  name: string,
  data: any,
  history?: HistoryChacheEntry,
  hasChanges: boolean;
  lastSavedIndex: number;
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
  mainEditor: SunEditor;
  editorMenu: MenuItem[] = [];
  isReferenceChooseVisible;
  selectedReference;
  currentReference;
  noteData: { visible: boolean, editor?: SunEditor, note?: ProjectNote } = { visible: false, editor: undefined, note: undefined };
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

    this.projectService.referenceSelected$.subscribe( reference => {
      const referenceTool = this.projectService.currentReferenceRange.plugins['reference'];
      referenceTool.apply(this.projectService.currentReferenceRange, reference.path);
      this.projectService.currentReferenceRange = undefined;
    });

    document.addEventListener('keydown', this.saveKeyDown);

    this.generateEditorMenu();
  }

  saveKeyDown = (e) => {
    if(e.ctrlKey && (e.key === 's' || e.key === 'S')){
      this.saveCurrentPage()
    }
  }

  onHierarchyMenuInit(hierarchyMenuService: HierarchyMenuService){
    this.hierarchyMenuService = hierarchyMenuService;
  }

  onEditorDataChange(changes: DataChangeEvent){
    this.editorService.onChanges$.next(changes);
    if(this.currentOpenedPage){
      this.currentOpenedPage!.hasChanges = this.mainEditor.core.history.stackIndex != this.currentOpenedPage?.lastSavedIndex;
      this.generateEditorMenu();
    }
  }

  async openItem(item){
    const fileInTabs = this.openedFiles.find( f => f.id === item.id );
    if(fileInTabs){
      this.currentOpenedPage = this.openedFilesMaps[fileInTabs.id];
      return;
    }
    const file: OpenedPage = {
      id: item.id,
      path: item.path,
      name: item.name,
      data: undefined,
      hasChanges: false,
      lastSavedIndex: 0,
    }
    this.openedFiles.push(file);
    this.projectService.readFile(item.path).subscribe(
      res => {
        console.log(res);
        const data =  res ? JSON.parse(res) : null;
        file.data = data;
        this.openedFilesMaps[item.id] = file
        this.openFile({tab: this.openedFilesMaps[item.id]});
      }
    );
  }

  onItemDeleted(item: ProjectFile){
    this.closeFile({tab: item as any});
  }

  onNodeSelected(node){
    node?.scrollIntoView({behavior: 'smooth'});
  }

  closeFile({tab: item}: {tab: OpenedPage}){
    const itemIndex = this.openedFiles.findIndex( f => f.id === item.id );
    if(itemIndex > -1){
      this.openedFiles.splice(itemIndex, 1);
    }
    if(this.openedFiles.length === 0){
      this.currentOpenedPage = undefined;
    } else if(this.currentOpenedPage === this.openedFilesMaps[item.id]){
      // the current page was closed
      if(itemIndex < this.openedFiles.length - 1){
        this.currentOpenedPage = this.openedFilesMaps[this.openedFiles[itemIndex].id];
      } else {
        this.currentOpenedPage = this.openedFilesMaps[this.openedFiles[this.openedFiles.length-1].id];
      }
    } else {
      if(itemIndex > this.openedFiles.length - 1){
        this.currentOpenedPage = this.openedFilesMaps[this.openedFiles[this.openedFiles.length-1].id];
      } else {
        this.currentOpenedPage = this.currentOpenedPage;
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
      let editorData = this.mainEditor.getContents(true);
      this.editorService.addHistory(this.currentOpenedPage.id, this.getCurrentHistory());
      this.currentOpenedPage.data = editorData;
      this.currentOpenedPage.history = this.editorService.getHistory(item.id);
    }
    this.currentOpenedPage = this.openedFilesMaps[item.id];
  }

  getCurrentHistory(){
    return {
      stackIndex: this.mainEditor.core.history.getCurrentIndex(),
      stack: [...this.mainEditor.core.history.stack]
    };
  }

  onMainEditorReady(editor: SunEditor){
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
    const referencePath = event.target.attributes['de-reference'].nodeValue;
    const item = this.hierarchyMenuService.getFileItemFromIndex(referencePath)?.item;
    this.projectService.readFile(item.path).subscribe( res => {
      this.currentReference = {
        data: res ? JSON.parse(res) : null,
        name: item.name,
        id: item.id
      }
      this.referenceOP.toggle(event);
    });
  }

  openCreateNote(){
    this.noteData.visible = true;
    this.noteData.note = {id: generateUUID(), title: 'New Note Title', position: this.project.notes?.length || 0, path: ''};
  }

  onNoteEditorReady(editor: SunEditor){
    this.noteData.editor = editor;
  }

  createNote(note: ProjectNote){
    this.projectService.createNote(
      {
        id: note.id,
        title: note.title,
        position: this.project.notes?.length,
        path: '/' + note.title.toLowerCase().replace(' ', '_')
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

  saveCurrentPage(){
    if(this.currentOpenedPage){
      this.currentOpenedPage.hasChanges = false;
      this.currentOpenedPage.lastSavedIndex = this.mainEditor.core.history.stackIndex;
      console.log(this.mainEditor.getContents(true));
      this.projectService.saveFile(this.currentOpenedPage!.path, this.mainEditor.getContents(true)).subscribe( res => {
        console.log('File', this.currentOpenedPage!.path, 'saved', res);
      })
      this.mainEditor.save();
    }
  }

  saveAll(){
    Object.keys(this.openedFilesMaps).forEach( key => {
      const page = this.openedFilesMaps[key];
      if(page.hasChanges){
        this.projectService.saveFile(page!.path, page === this.currentOpenedPage? this.mainEditor.getContents(true) : page.data).subscribe( res => {
          console.log('File', page!.path, 'saved', res);
          page.hasChanges = false;
          page.lastSavedIndex = this.editorService.getHistory(page.id).stackIndex;
        })
      }
    })
  }

  private generateEditorMenu(){
    this.editorMenu = [
      {
        label: 'Save',
        command: () => this.saveCurrentPage(),
        icon: PrimeIcons.SAVE,
        title: 'Save',
        id: 'SAVE',
        disabled: !this.currentOpenedPage?.hasChanges,
      },
      {
        label: 'Save All',
        command: () => this.saveAll(),
        icon: PrimeIcons.SAVE,
        title: 'Save All',
        id: 'SAVE_ALL',
        disabled: !this.atLeastOnePageHasChanges(),
      },
      {
        label: 'Add Note',
        command: () => this.openCreateNote(),
        icon: PrimeIcons.PLUS,
        title: 'Add Note',
        id: 'ADD_NOTE'
      }
    ]
  }

  private atLeastOnePageHasChanges(){
    return Object.values(this.openedFilesMaps).some( page => page.hasChanges);
  }

  ngOnDestroy(){
    document.removeEventListener('keydown', this.saveKeyDown);
  }

}
