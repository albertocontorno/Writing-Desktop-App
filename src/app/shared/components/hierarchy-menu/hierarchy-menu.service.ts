import { Subject } from 'rxjs';
import { Injectable } from '@angular/core';
import { ProjectFile } from '../../models/project.model';
import { getRandomInt } from '../../utils/Math.utils';
import { generateUUID } from '../../utils/utils';
interface DragginInfo {
  phase: 'START' | 'DRAGGING' | 'END'
}
@Injectable({
  providedIn: 'root'
})
export class HierarchyMenuService {

  itemSelected$: Subject<ProjectFile | undefined> = new Subject();
  toggleItem$: Subject<{item: ProjectFile | null, state: boolean}> = new Subject();
  editItem$: Subject<ProjectFile> = new Subject();
  openItem$: Subject<ProjectFile> = new Subject();
  draggingInfo$: Subject<DragginInfo> = new Subject();
  itemDragged?: ProjectFile;

  updateCollapsedOnItem?: boolean = false;
  enableDragAndDrop?: boolean = true;
  isAddingOrEditing: boolean = false;
  editingItem?: ProjectFile;

  filesIndex: any/* {[key: string]: ProjectFile} */ = {};
  private _files: ProjectFile[] = [];
  set files ( v: ProjectFile[]){
    this._files = v;
    this.filesIndex = {};
    this.createFileIndex(this._files, this.filesIndex);
  }
  get files(){
    return this._files;
  }
  
  constructor() { }

  selectItem(item?: ProjectFile){
    console.log('[selectItem]', item);
    this.itemSelected$.next(item);
  }

  openItem(item: ProjectFile){
    this.openItem$.next(item)
  }

  collapse(item: ProjectFile){
    this.toggleItem$.next({item: item, state: true});
  }
  collapseAll(){
    this.toggleItem$.next({item: null, state: true});
  }
  expand(item: ProjectFile){
    this.toggleItem$.next({item, state: false});
  }
  expandAll(){
    this.toggleItem$.next({item: null, state: false});
  }
  isCreatingNew = false;
  edit(item: ProjectFile, isCreatingNew: boolean = false){
    this.editItem$.next(item);
    this.editingItem = item;
    this.isAddingOrEditing = true;
    this.isCreatingNew = isCreatingNew;
  }

  createFileIndex(items, index){
    items?.forEach( item => {
      if(item.type === 'FOLDER'){
        const newSubIndex = {item: item};
        index[this.getItemPathName(item.name)] = newSubIndex;
        this.createFileIndex(item.children, newSubIndex);
      } else {
        index[this.getItemPathName(item.name)] = {item};
      }
    });
  }

  getItemPathName(name: string){
    return name.toLowerCase().replace(' ', '_');
  }

  getFileItemFromIndex(itemPath: string){
    const path = itemPath;
    let file = this.filesIndex;
    path.split('/').forEach( (p: string) => {
      if(p){
        file = file[p]
      }
    });
    return file;
  }

  getFileItemParentFromIndex(itemPath: string){
    const parentPath = itemPath.substring(0, itemPath.lastIndexOf('/'));
    let parent = this.filesIndex;
    parentPath.split('/').forEach( (p: string) => {
      if(p){
        parent = parent[p]
      }
    });
    return parent;
  }


  deleteFile(item: ProjectFile){
    let parent = this.getFileItemParentFromIndex(item.path);
    let name = this.getItemPathName(item.name);
    if(!parent){
      const index = this.files?.findIndex( el => el === item ) || -1 ;
      if(index !== null && index > -1){
        this.files.splice(index, 1);
        this.files.forEach( (c, i) => {
          c.position = i;
        });
      }
    } else {
      if(parent === this.filesIndex){
        if(parent[name]){
          const index = this.files.findIndex( f => f.id === parent[name].item.id )
          this.files.splice(index, 1);
          this.files.forEach( (c, i) => {
            c.position = i;
          });
        }
      } else {
        const index = parent.item.children?.findIndex( el => el === item );
        if(index !== null && index > -1){
          parent.item.children?.splice(index, 1);
          parent.item.children.forEach( (c, i) => {
            c.position = i;
          });
        }
      }
    }
    //update index
    delete parent[name];
    console.log(this.files, this.filesIndex);
  }

  deleteFileByPath(path: string, itenName: string){
    let parent = this.getFileItemParentFromIndex(path);
    let name = this.getItemPathName(itenName);
    if(!parent){
      const index = this.files?.findIndex( el => el.path === path ) || -1 ;
      if(index !== null && index > -1){
        this.files.splice(index, 1);
        this.files.forEach( (c, i) => {
          c.position = i;
        });
      }
    } else {
      if(parent === this.filesIndex){
        if(parent[name]){
          const index = this.files.findIndex( f => f.id === parent[name].item.id )
          this.files.splice(index, 1);
          this.files.forEach( (c, i) => {
            c.position = i;
          });
        }
      } else {
        const index = parent.item.children?.findIndex( el => el.path === path );
        if(index !== null && index > -1){
          parent.item.children?.splice(index, 1);
          parent.item.children.forEach( (c, i) => {
            c.position = i;
          });
        }
      }
    }
    //update index
    delete parent[name];
    console.log(this.files, this.filesIndex);
  }

  createFile(selectedItem: ProjectFile, type: 'FILE' | 'FOLDER'){
    let newItem : ProjectFile = {
      name: type === 'FILE' ? 'New File' : 'New Folder',
      id: generateUUID(),
      type: type,
      path: '',
      children: [],
      position: 0,
      data: { blocks: [] }
    };
    if(!selectedItem){
      newItem.path = type === 'FILE' ? '/new_file' : '/new_folder';
      newItem.position = this.files.length;
      if(this.filesIndex['new_file']){
        const n = '_' + getRandomInt(1, 10000);
        newItem.name += n;
        newItem.path += n;
      }
      this.files.push(newItem);
      this.filesIndex[this.getItemPathName(newItem.name)] = {item: newItem};
    } else if(selectedItem.type === 'FOLDER'){
      newItem.path = type === 'FILE' ? `${selectedItem.path}/new_file` : `${selectedItem.path}/new_folder`;
      newItem.position = selectedItem.children!.length;
      selectedItem.children!.push(newItem);
      selectedItem.collapsed = false;
      this.expand(selectedItem);
      let parent = this.getFileItemFromIndex(selectedItem.path);
      if(parent['new_file'] || parent['new_folder']){
        const n = '_' + getRandomInt(1, 10000);
        newItem.name += n;
        newItem.path += n;
      }
      parent[this.getItemPathName(newItem.name)] = {item: newItem};
    } else if(selectedItem.type === 'FILE'){
      let parent = this.getFileItemParentFromIndex(selectedItem.path);
      if(parent){
        if(parent === this.filesIndex){
          newItem.path = type === 'FILE' ? '/new_file' : '/new_folder';
          newItem.position = this.files.length;
          this.files.push(newItem);
          this.filesIndex[this.getItemPathName(newItem.name)] = {item: newItem};
        } else {
          newItem.path = type === 'FILE' ? `${parent.item.path}/new_file` : `${parent.item.path}/new_folder`;
          if(parent['new_file'] || parent['new_folder']){
            const n = '_' + getRandomInt(1, 10000);
            newItem.name += n;
            newItem.path += n;
          }
          newItem.position = parent.item.children!.length;
          parent.item.children!.push(newItem);
          this.expand(parent.item);
          parent[this.getItemPathName(newItem.name)] = {item: newItem};
        }
      } else {
        newItem.path = type === 'FILE' ? '/new_file' : '/new_folder';
      }
    } 
    console.log(this.files, this.filesIndex);
    return newItem;
  }

  moveItem(item: ProjectFile, newParent?: ProjectFile, position = -1){
    if(item === newParent){
      return;
    }
    const oldPath = item.path;
    if(newParent){
      const old = this.getFileItemFromIndex(item.path);
      if(this.checkIfDirectParent(item, newParent)){
        if(item.position < position){
          position -= 1;
        }
      }
      this.deleteFile(item);
      newParent.children?.splice(position, 0, item);
      
      newParent.children!.forEach( (c, i) => {
        c.position = i;
      });
      this.updateItemPath(item, newParent);
      this.getFileItemFromIndex(newParent.path)[this.getItemPathName(item.name)] = old;
    } else {
      // move in root
      const old = this.getFileItemFromIndex(item.path);
      if(this.checkIfInRoot(item)){
        if(item.position < position){
          position -= 1;
        }
      }
      this.deleteFile(item);
      this.files.splice(position, 0, item);
      this.files.forEach( (c, i) => {
        c.position = i;
      });
      this.updateItemPath(item, {path: ''});
      this.filesIndex[this.getItemPathName(item.name)] = old;
    }
    console.log(this.files, this.filesIndex);
    return { newPath: item.path, oldPath: oldPath };
  }

  updateItemName(item: ProjectFile, newName: string){
    if(!(newName.trim())){
      return false;
    };
    
    if(newName){
      const parent = this.getFileItemParentFromIndex(item.path);
      // check name already exists!
      const sameNameItem = parent !== this.filesIndex 
        ? parent.item.children.find( i => i.name === newName )
        : parent[this.getItemPathName(newName)];
      if(sameNameItem){
        if(sameNameItem === item){
          return true;
        }
        console.log('Item with same name', sameNameItem);
        return false;
      }
      const oldName = item.name;
      item.name = newName;
      // update item path and item children paths recursively and filesIndex
      const oldIndexed = parent[this.getItemPathName(oldName)];
      delete parent[this.getItemPathName(oldName)];
      parent[this.getItemPathName(newName)] = oldIndexed ? oldIndexed : {item};
      this.updateItemPath(item);
      console.log(this.files, this.filesIndex);
      return true;
    }
    return false;
  }

  checkNotSameNameItem(item: ProjectFile, newName: string){
    const parent = this.getFileItemParentFromIndex(item.path);
    // check name already exists!
    const sameNameItem = parent !== this.filesIndex 
      ? parent.item.children.find( i => i.name === newName )
      : parent[this.getItemPathName(newName)];
    if(sameNameItem){
      if(sameNameItem === item){
        return true;
      }
      console.log('Item with same name', sameNameItem);
      return false;
    }
    return true;
  }

  updateItemPath(item, parent?){
    item.path = parent ? parent.path + '/' + this.getItemPathName(item.name) : item.path.substring(0, item.path.lastIndexOf('/')+1) + this.getItemPathName(item.name);
    if(item.children){
      item.children.forEach( el => {
        this.updateItemPath(el, item);
      });
    };
  }

  /* ======== UTILS ======== */

  checkIfParentInHierarchy(item: ProjectFile, parent: ProjectFile): boolean{
    return item.path.startsWith(parent.path);
  }

  checkIfSiblingInHierarchy(item: ProjectFile, parent: ProjectFile): boolean{
    return item.path.substring(0, item.path.lastIndexOf('/')).startsWith(parent.path.substring(0, item.path.lastIndexOf('/')));
  }

  checkIfDirectParent(item: ProjectFile, parent: ProjectFile){
    return item.path.substring(0, item.path.lastIndexOf('/')) === parent.path
  }

  checkIfInRoot(item: ProjectFile){
    return item.path.split('/').length === 2;
  }

  /* ======== Drag&Drop ======== */

  takePrevItem(item: ProjectFile): ProjectFile{
    let prevItem = this.getFileItemParentFromIndex(item.path);
    if(prevItem === this.filesIndex){
      for(let i = 0; i<this.files.length; i++){
        if(this.files[i].path === item.path){
          if(i === 0){
            prevItem = null;
          } else {
            prevItem = this.files[i-1];
          }
          break;
        }
      }
    } else {
      prevItem = prevItem.item;
      const i = prevItem.children.findIndex( c => c.path === item.path );
      if(i > -1){
        if(i !== 0){
          prevItem = prevItem.children[i-1];
        }
      }
    }
    return prevItem;
  }

}
