import { MenuItem, PrimeIcons } from 'primeng/api';
import { ProjectFile } from './../../models/project.model';
import { Component, Input, OnInit, Output, EventEmitter, HostListener, ViewChild } from '@angular/core';
import { HierarchyMenuService } from './hierarchy-menu.service';
import { ProjectService } from '../../services/project.service';

@Component({
  selector: 'app-hierarchy-menu',
  templateUrl: './hierarchy-menu.component.html',
  styleUrls: ['./hierarchy-menu.component.scss'],
  providers: [HierarchyMenuService]
})
export class HierarchyMenuComponent implements OnInit {
  @Input() name: string = 'Test Project';
  @Input() updateCollapsedOnItem?: boolean = false;
  @Input() showContextMenu?: boolean = true;
  @Input() showAddActions? = true;
  @Input() enableDragAndDrop? = true;
  _items: ProjectFile[] = [];
  @Input() set items ( v: ProjectFile[] ){
    this._items = v;
    this.hierarchyMenuService.files = v;
  }

  @HostListener('document:keydown', ['$event']) onKeydown (e) {
    if(this.selectedItem && e.key === 'Delete'){
      this.hierarchyMenuService.deleteFile(this.selectedItem!);
      this.selectedItem = undefined;
    }
  }
  

  @Output() init: EventEmitter<HierarchyMenuService> = new EventEmitter();
  @Output() openItem: EventEmitter<ProjectFile> = new EventEmitter();
  @Output() itemDeleted: EventEmitter<ProjectFile> = new EventEmitter();
  @Output() itemSelected: EventEmitter<ProjectFile | undefined> = new EventEmitter();

  selectedItem?: ProjectFile;
  contextMenu: MenuItem[] = [
    {
      label: 'Delete',
      icon: PrimeIcons.TRASH,
      command: () => {
        if(this.hierarchyMenuService.isAddingOrEditing){
          return;
        }
        this.hierarchyMenuService.deleteFile(this.selectedItem!);
        if(this.selectedItem!.type === 'FILE'){
          this.projectService.removeFile(this.selectedItem!.path);
        } else {
          this.projectService.removeFolder(this.selectedItem!.path);
        }
        this.itemDeleted.next(this.selectedItem!);
        this.selectedItem = undefined;
      }
    },
    {
      label: 'Rename',
      icon: PrimeIcons.PENCIL,
      command: () => {
        if(this.hierarchyMenuService.isAddingOrEditing){
          return;
        }
        this.hierarchyMenuService.edit(this.selectedItem!);
      }
    }
  ]

  @ViewChild('hierarchyItems') hierarchyItems;

  constructor(private hierarchyMenuService: HierarchyMenuService, private projectService: ProjectService) {
    this.hierarchyMenuService.itemSelected$.subscribe( item => {
      this.selectedItem = item;
      this.itemSelected.next(this.selectedItem) 
    });
    this.hierarchyMenuService.openItem$.subscribe( item => this.openItem.next(item) );
  }

  ngOnInit(): void {
    this.init.next(this.hierarchyMenuService);
    this.hierarchyMenuService.updateCollapsedOnItem = this.updateCollapsedOnItem;
    this.hierarchyMenuService.enableDragAndDrop = this.enableDragAndDrop;
  }

  collapseAll(){
    this.hierarchyMenuService.collapseAll();
  }
   
  onItemSelected(item: ProjectFile){
    this.selectedItem = item;
  }

  addFolder(){
    if(this.hierarchyMenuService.isAddingOrEditing){
      return;
    }
    const newItem = this.hierarchyMenuService.createFile(this.selectedItem!, 'FOLDER');
    setTimeout( () => this.hierarchyMenuService.edit(newItem, true) );
  }

  addFile(){
    if(this.hierarchyMenuService.isAddingOrEditing){
      return;
    }
    const newItem = this.hierarchyMenuService.createFile(this.selectedItem!, 'FILE');
    setTimeout( () => this.hierarchyMenuService.edit(newItem, true) );
  }

  onContainerClicked(){
    this.hierarchyMenuService.selectItem(undefined);
  }

}
