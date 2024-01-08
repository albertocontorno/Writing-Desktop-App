import { ProjectConstants } from './../constants/Project.contants';
import { Injectable } from '@angular/core';
import { Observable, Subject, concatMap, forkJoin, map, of, take, tap } from 'rxjs';
import { ElectronService } from './electron/electron.service';
import { ObservablesUtils } from '../utils/Observables.utils';
import { ProjectSettings } from '../models/ProjectSettings.model';
import { Project, ProjectFile, ProjectNote } from '../models/project.model';
import { ProjectInfoChanges } from '../models/internals/ProjectInfoChanges.model';
import { FolderStructure } from '../../../../app/models/FolderStructure.model';
import { generateUUID } from '../utils/utils';
import { OutputData } from '@editorjs/editorjs';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  chooseReference$: Subject<any> = new Subject();
  referenceSelected$: Subject<ProjectFile> = new Subject();
  openReference$: Subject<any> = new Subject();
  onChange$: Subject<ProjectInfoChanges> = new Subject<ProjectInfoChanges>();

  project: Project;
  get filesIndex(): ProjectFile[]{
    return this.project.files;
  }
  settings: ProjectSettings;
  
  constructor(private electronService: ElectronService) { }

  notifyChanges(){
    this.onChange$.next({
      project: this.project,
      settings: this.settings
    })
  }

  saveProjectAsync(){
    return this.electronService.writeFile(`${this.project.rootPath}\\${ProjectConstants.PROJECT_JSON}`, JSON.stringify(this.project))
      .pipe(tap(() => this.notifyChanges()));
  }

  saveProject(){
    this.electronService.writeFile(`${this.project.rootPath}\\${ProjectConstants.PROJECT_JSON}`, JSON.stringify(this.project)).subscribe( res => {
      console.log('project saved');
      this.notifyChanges();
    });
  }
  
  set(project: Project, settings: ProjectSettings){
    this.project = project;
    this.settings = settings;

    this.onChange$.next({project, settings});
  }
  
  load(projectPath: string){
    const obs$: readonly [ Observable<string>, Observable<string>, Observable<FolderStructure[]>, Observable<FolderStructure[]> ] = [
      // Load project JSON
      this.electronService.readFile(`${projectPath}/${ProjectConstants.PROJECT_JSON}`),
      // Load settings JSON
      this.electronService.readFile(`${projectPath}/${ProjectConstants.PROJECT_SETTINGS_JSON}`),
      // Load content and create files index -> update files in project
      this.electronService.getAllFoldersContent(`${projectPath}/${ProjectConstants.PROJECT_CONTENT}`),
      // Load notes and create notes index -> update notes in project
      this.electronService.getAllFoldersContent(`${projectPath}/${ProjectConstants.PROJECT_NOTES}`)
    ];

    return forkJoin<[string, string, FolderStructure[], FolderStructure[]]>(obs$).pipe(take(1), ObservablesUtils.CATCH_ERRORS, map( (values: [string, string, FolderStructure[], FolderStructure[]]) => {
      this.project = JSON.parse(values[0]);
      this.settings = JSON.parse(values[1]);
      // update files in project
      this.syncFilesIndex(this.project.files, values[2]);
      this.syncNotesIndex(this.project.notes, values[3]);

      this.onChange$.next({
        project: this.project,
        settings: this.settings,
      });

      console.log(this.project, this.settings);

      return true;
    }));

  }

  private syncFilesIndex(projectFiles, contentFiles){
    // TODO
    // For each file in project files find the one in the index (using file.id === fileIndex.id)
    // if found -> set name of fileIndex to the one of the file (transform the string), flag the entry in the index as found
    // if !found -> add to fileIndex with position at the end
    // delete all the entries in the index that are not found
  }
  private syncNotesIndex(projectNotes, notesFiles){
    // TODO
  }

  readFile(filePath: string){
    const path = `${this.project.rootPath}\\${ProjectConstants.PROJECT_CONTENT}\\${filePath.substring(1)}`;
    return this.electronService.readFile(path);
  }

  readNote(filePath: string){
    const path = `${this.project.rootPath}\\${ProjectConstants.PROJECT_NOTES}\\${filePath}`;
    return this.electronService.readFile(path);
  }

  saveFile(filePath: string, payload: any){
    const path = `${this.project.rootPath}\\${ProjectConstants.PROJECT_CONTENT}\\${filePath.substring(1)}`;
    return this.electronService.writeFile(path, JSON.stringify(payload));
  }

  createNote(note: ProjectNote, data: OutputData){
    const id = generateUUID();
    return this.saveNote(note.title.toLowerCase().replace(/\s/g, '_'), {
        id: note.id,
        ...data
      }).pipe(
        concatMap( res => {
        this.project.notes.push(note);
        return this.saveProjectAsync();
        })
      );
  }

  saveNote(filePath: string, payload: any){
    const path = `${this.project.rootPath}\\${ProjectConstants.PROJECT_NOTES}\\${filePath}`;
    return this.electronService.writeFile(path, JSON.stringify(payload));
  }

  updateNote(oldTitle: string, newTitle: string, note: any){
    const path = `${this.project.rootPath}\\${ProjectConstants.PROJECT_NOTES}\\`;
    if(oldTitle !== newTitle){
      const oldPath = `${path}${oldTitle.toLowerCase().replace(/\s/g, '_')}`;
      const newPath = `${path}${newTitle.toLowerCase().replace(/\s/g, '_')}`;
      return this.electronService.renameFilerOrFolder(oldPath, newPath).pipe(
        concatMap(
          _ => {
            return this.electronService.writeFile(newPath, JSON.stringify(note))
          }
        ),
        concatMap( res => this.saveProjectAsync() )
      );
    } else {
      const oldPath = `${path}${oldTitle.toLowerCase().replace(/\s/g, '_')}`;
      return this.electronService.writeFile(oldPath, JSON.stringify(note)).pipe(
        concatMap( res => this.saveProjectAsync() )
      );
    }
  }

  removeNote(filePath: string){
    const path = `${this.project.rootPath}\\${ProjectConstants.PROJECT_NOTES}\\${filePath.toLowerCase().replace(/\s/g, '_')}`;
    this.electronService.removeFile(path).subscribe( () => {
      console.log('file removed', path);
      this.saveProject();
    })
  }

  createFile(filePath: string){
    const path = `${this.project.rootPath}\\${ProjectConstants.PROJECT_CONTENT}\\${filePath.substring(1)}`;
    this.electronService.createFile(path).subscribe( res => {
      console.log('file created', path, res);
      this.saveProject();
    });
  }

  removeFile(filePath: string){
    const path = `${this.project.rootPath}\\${ProjectConstants.PROJECT_CONTENT}\\${filePath.substring(1)}`;
    this.electronService.removeFile(path).subscribe( () => {
      console.log('file removed', path);
      this.saveProject();
    })
  }

  removeFolder(filePath: string){
    const path = `${this.project.rootPath}\\${ProjectConstants.PROJECT_CONTENT}\\${filePath.substring(1)}`;
    this.electronService.removeFolder(path).subscribe( () => {
      console.log('folder removed', path);
      this.saveProject();
    })
  }

  createFolder(folderPath: string){
    const path = `${this.project.rootPath}\\${ProjectConstants.PROJECT_CONTENT}\\${folderPath.substring(1)}`;
    this.electronService.createFolder(path).subscribe( res => {
      console.log('folder created', path, res);
      this.saveProject();
    })
  }

  renameFilerOrFolder(oldPath: string, newPath: string){
    oldPath = `${this.project.rootPath}\\${ProjectConstants.PROJECT_CONTENT}\\${oldPath.substring(1)}`;
    newPath = `${this.project.rootPath}\\${ProjectConstants.PROJECT_CONTENT}\\${newPath.substring(1)}`;
    this.electronService.renameFilerOrFolder(oldPath, newPath).subscribe( res => {
      console.log('file or folder renamed', oldPath, newPath, res);
      this.saveProject();
    })
  }

  moveFileOrFolder(oldPath: string, newPath: string){
    oldPath = `${this.project.rootPath}\\${ProjectConstants.PROJECT_CONTENT}\\${oldPath.substring(1)}`;
    newPath = `${this.project.rootPath}\\${ProjectConstants.PROJECT_CONTENT}\\${newPath.substring(1)}`;
    if(oldPath === newPath){
      this.saveProject();
      return;
    }
    this.electronService.moveFilerOrFolder(oldPath, newPath).subscribe( res => {
      console.log('file or folder moved', oldPath, newPath, res);
      this.saveProject();
    })
  }

  /*  */
  currentReferenceRange
  openSelectReference(range){
    this.currentReferenceRange = range;
    this.chooseReference$.next(true);
  }

}
