import { Component, Input, OnInit} from '@angular/core';
import { HierarchyMenuService } from '../hierarchy-menu.service';
import { ProjectFile } from '../../../models/project.model';
import { ProjectService } from '../../../services/project.service';

@Component({
  selector: 'app-hierarchy-menu-item',
  templateUrl: './hierarchy-menu-item.component.html',
  styleUrls: ['./hierarchy-menu-item.component.scss']
})
export class HierarchyMenuItemComponent implements OnInit {

  @Input() item: ProjectFile;
  @Input() hasParent = false;
  @Input() isEditing = false;
  @Input() collapsed? = false;
  isInvalid: boolean = false;
  updateCollapsedOnItem?: boolean = false;
  enableDragAndDrop?: boolean = true;
  isSelected: boolean =  false;

  isDragUp: boolean = false;
  isDragBelow: boolean = false;

  constructor(private hierarchyMenuService: HierarchyMenuService, private projectService: ProjectService) {
    hierarchyMenuService.itemSelected$.subscribe( item => this.isSelected = item === this.item );
    hierarchyMenuService.editItem$.subscribe( item => {
      if(item === this.item){
        this.isEditing = true;
      }
    });
    hierarchyMenuService.toggleItem$.subscribe( ({item, state}) => {
      if(this.item.type === 'FOLDER'){
        this.collapsed = (!item || this.item === item) ? state : this.collapsed;
        if(this.updateCollapsedOnItem){
          this.item.collapsed = this.collapsed;
        }
        
      }
    });
    hierarchyMenuService.draggingInfo$.subscribe( (info) => {
      if(info.phase === 'END'){
        this.isDragUp = false;
        this.isDragBelow = false;
      }
    });
    this.updateCollapsedOnItem = hierarchyMenuService.updateCollapsedOnItem;
    this.enableDragAndDrop = hierarchyMenuService.enableDragAndDrop;
  }

  ngOnInit(): void {
  }

  onItemSelected(event?: Event, toggle = false){
    event?.stopPropagation();
    this.hierarchyMenuService.selectItem(this.item);
    if(toggle){
      this.toggle();
    }
  }

  onOpenItem(){
    if(this.isEditing 
      || this.hierarchyMenuService.editingItem === this.item
      || (this.hierarchyMenuService.editingItem && this.hierarchyMenuService.checkIfParentInHierarchy(this.hierarchyMenuService.editingItem, this.item))
    ){ 
      return;
    }
    this.hierarchyMenuService.openItem(this.item);
  }

  onBlur(e: any){
    if(this.isInvalid){
      e.target.focus();
      return;
    }
    this.isEditing = false;
    this.hierarchyMenuService.isAddingOrEditing = false;
    this.hierarchyMenuService.editingItem = undefined;
    const oldPath = this.item.path;
    this.hierarchyMenuService.updateItemName(this.item, e.target.value);
    if(this.hierarchyMenuService.isCreatingNew){
      this.hierarchyMenuService.isCreatingNew = false;
      // create file
      if(this.item.type === 'FILE'){
        this.projectService.createFile(this.item.path);
      } else {
        this.projectService.createFolder(this.item.path);
      }
    } else {
      // rename
      this.projectService.renameFilerOrFolder(oldPath, this.item.path);
    }
  }

  onInput(e: any){
    if(!this.hierarchyMenuService.checkNotSameNameItem(this.item, e.target.value)){
      e.target.focus();
      this.isInvalid = true;
      return;
    }
    console.log(JSON.parse(JSON.stringify(this.hierarchyMenuService.filesIndex)))
    this.isInvalid = false;
  }

  toggle(){
    if(this.isEditing 
      || this.hierarchyMenuService.editingItem === this.item
      || (this.hierarchyMenuService.editingItem && this.hierarchyMenuService.checkIfParentInHierarchy(this.hierarchyMenuService.editingItem, this.item))
    ){ 
      return;
    }
    this.collapsed = !this.collapsed;
    if(this.updateCollapsedOnItem && this.item.collapsed !== undefined){
      this.item.collapsed = this.collapsed;
    }
  }

  drop(e: any){
    if(!this.enableDragAndDrop){
      return;
    }
    this.hierarchyMenuService.draggingInfo$.next({phase: 'END'});
    const itemToMove = this.hierarchyMenuService.itemDragged!;
    let dragElement: HTMLElement | null = e.srcElement;
    while(dragElement && dragElement.tagName !== 'DIV'){
      dragElement = dragElement.parentElement ? dragElement.parentElement : dragElement;
    }
    if(dragElement){
      let movedInfo;
      const rect = dragElement.getBoundingClientRect();
      // if true take element below else take element after
      if(e.y > (rect.y + rect.height - 8)){
        if(this.item.type === 'FOLDER'){
          if(!this.item.collapsed){
            // if open -> put it inside at position 0
            movedInfo = this.hierarchyMenuService.moveItem(itemToMove, this.item, 0);
          } else {
            // else put after the folder (take the parent and put item after the file in parent)
            const parent: ProjectFile = this.hierarchyMenuService.getFileItemParentFromIndex(this.item.path)?.item;
            movedInfo = this.hierarchyMenuService.moveItem(itemToMove, parent, this.item.position+1);
          }
        } else {
          // if file -> put after the file (take the parent and put item after the file in parent)
          const parent: ProjectFile = this.hierarchyMenuService.getFileItemParentFromIndex(this.item.path)?.item;
          movedInfo = this.hierarchyMenuService.moveItem(itemToMove, parent, this.item.position+1);
        }
        if(movedInfo){
          this.projectService.moveFileOrFolder(movedInfo.oldPath, movedInfo.newPath);
        }
        return;
      } else if(e.y < (rect.y + 8)){
        // move draggedItem before this item
        const parent: ProjectFile = this.hierarchyMenuService.getFileItemParentFromIndex(this.item.path)?.item;
        const position = this.item.position-1 > -1 ? this.item.position-1: 0;
        movedInfo = this.hierarchyMenuService.moveItem(itemToMove, parent, this.item.position);
        if(movedInfo){
          this.projectService.moveFileOrFolder(movedInfo.oldPath, movedInfo.newPath);
        }
        return;
      } else {
        // if file put it in the parent at the end
        // else folder put it at the end of the folder
        if(this.item.type === 'FOLDER'){
          movedInfo = this.hierarchyMenuService.moveItem(itemToMove, this.item, this.item.children!.length);
        } else {
          const parent: ProjectFile = this.hierarchyMenuService.getFileItemParentFromIndex(this.item.path)?.item;
          movedInfo = this.hierarchyMenuService.moveItem(itemToMove, parent, parent.children!.length);
        }
        if(movedInfo){
          this.projectService.moveFileOrFolder(movedInfo.oldPath, movedInfo.newPath);
        }
      }
    }
    
  }

  onDragStart(e: any, item: any){
    if(!this.enableDragAndDrop || this.isEditing){ 
      return;
    }
    this.hierarchyMenuService.itemDragged = item;
  }

  onDragLeave(e: any){
    if(!this.enableDragAndDrop){
      return;
    }
    this.isDragUp = false;
    this.isDragBelow = false;
  }

  onDragEnd(e: any){
    if(!this.enableDragAndDrop){
      return;
    }
    this.hierarchyMenuService.draggingInfo$.next({phase: 'END'});
  }

  onDragOver(e: any){
    if(!this.enableDragAndDrop){
      return;
    }
    e.dataTransfer.dropEffect = "move";
    e.preventDefault();
    e.stopPropagation();

    let dragElement: HTMLElement | null = e.srcElement;
    while(dragElement && dragElement.tagName !== 'DIV'){
      dragElement = dragElement.parentElement ? dragElement.parentElement : dragElement;
    }
    if(dragElement){
      const rect = dragElement.getBoundingClientRect();
      // if true take element below else take element after
      if(e.y > (rect.y + rect.height - 8)){
        this.isDragUp = false;
        this.isDragBelow = true;
        return;
      } else if(e.y < (rect.y + 8)){
        this.isDragUp = true;
        this.isDragBelow = false;
        return;
      } else {
        this.isDragUp = false;
        this.isDragBelow = false;
      }
    }
  }

}
