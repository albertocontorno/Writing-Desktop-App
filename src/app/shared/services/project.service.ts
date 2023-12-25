import { ProjectConstants } from './../constants/Project.contants';
import { Injectable } from '@angular/core';
import { Observable, Subject, forkJoin, map, take } from 'rxjs';
import { ElectronService } from './electron/electron.service';
import { ObservablesUtils } from '../utils/Observables.utils';
import { ProjectSettings } from '../models/ProjectSettings.model';
import { Project, ProjectFile } from '../models/project.model';
import { ProjectInfoChanges } from '../models/internals/ProjectInfoChanges.model';
import { FolderStructure } from '../../../../app/models/FolderStructure.model';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  onChange$: Subject<ProjectInfoChanges> = new Subject<ProjectInfoChanges>();

  project: Project;
  get filesIndex(): ProjectFile[]{
    return this.project.files;
  }
  settings: ProjectSettings;
  
  constructor(private electronService: ElectronService) { }

  saveProject(){
    this.electronService.writeFile(`${this.project.rootPath}\\${ProjectConstants.PROJECT_JSON}`, JSON.stringify(this.project)).subscribe( res => {
      console.log('project saved');
    });
  }
  
  set(project: Project, settings: ProjectSettings){
    this.project = project;
    this.settings = settings;

    this.onChange$.next({project, settings});
  }
  
  load(projectPath: string){
    const obs$: readonly [ Observable<string>, Observable<string>, Observable<FolderStructure[]> ] = [
      // Load project JSON
      this.electronService.readFile(`${projectPath}/${ProjectConstants.PROJECT_JSON}`),
      // Load settings JSON
      this.electronService.readFile(`${projectPath}/${ProjectConstants.PROJECT_SETTINGS_JSON}`),
      // Load content and create files index -> update files in project
      this.electronService.getAllFoldersContent(`${projectPath}/${ProjectConstants.PROJECT_CONTENT}`)
    ];

    return forkJoin<[string, string, FolderStructure[]]>(obs$).pipe(take(1), ObservablesUtils.CATCH_ERRORS, map( (values: [string, string, FolderStructure[]]) => {
      this.project = JSON.parse(values[0]);
      this.settings = JSON.parse(values[1]);
      // update files in project
      this.syncFilesIndex(this.project.files, values[2]);

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
  }

  readFile(filePath: string){
    const path = `${this.project.rootPath}\\${ProjectConstants.PROJECT_CONTENT}\\${filePath.substring(1)}`;
    return this.electronService.readFile(path);
  }

  saveFile(filePath: string, payload: any){
    const path = `${this.project.rootPath}\\${ProjectConstants.PROJECT_CONTENT}\\${filePath.substring(1)}`;
    return this.electronService.writeFile(path, JSON.stringify(payload));
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
      console.log('folder removed', path);
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


}
