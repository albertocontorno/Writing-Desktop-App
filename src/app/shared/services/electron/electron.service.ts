import { Injectable } from '@angular/core';

// If you import a module but never use any of the imported values other than as TypeScript types,
// the resulting javascript file will look as if you never imported the module at all.
import { OpenDialogReturnValue, ipcRenderer, webFrame } from 'electron';
import * as childProcess from 'child_process';
import * as fs from 'fs';
import { generateUUID } from '../../utils/utils';
import { Observable, defer, from, take } from 'rxjs';
import { FileSystemElement } from '../../../../../app/models/FileSystemElement.model';
import { FolderStructure } from '../../../../../app/models/FolderStructure.model';
import { CreateProjectReply } from '../../models/internals/create-project-reply.model';
import { ProjectConstants } from '../../constants/Project.contants';

@Injectable({
  providedIn: 'root'
})
export class ElectronService {
  ipcRenderer!: typeof ipcRenderer;
  webFrame!: typeof webFrame;
  childProcess!: typeof childProcess;
  fs!: typeof fs;

  constructor() {
    // Conditional imports
    if (this.isElectron) {
      this.ipcRenderer = (window as any).require('electron').ipcRenderer;
      this.webFrame = (window as any).require('electron').webFrame;

      this.fs = (window as any).require('fs');

      this.childProcess = (window as any).require('child_process');
      this.childProcess.exec('node -v', (error, stdout, stderr) => {
        if (error) {
          console.error(`error: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
          return;
        }
        console.log(`stdout:\n${stdout}`);
      });

      // Notes :
      // * A NodeJS's dependency imported with 'window.require' MUST BE present in `dependencies` of both `app/package.json`
      // and `package.json (root folder)` in order to make it work here in Electron's Renderer process (src folder)
      // because it will loaded at runtime by Electron.
      // * A NodeJS's dependency imported with TS module import (ex: import { Dropbox } from 'dropbox') CAN only be present
      // in `dependencies` of `package.json (root folder)` because it is loaded during build phase and does not need to be
      // in the final bundle. Reminder : only if not used in Electron's Main process (app folder)

      // If you want to use a NodeJS 3rd party deps in Renderer process,
      // ipcRenderer.invoke can serve many common use cases.
      // https://www.electronjs.org/docs/latest/api/ipc-renderer#ipcrendererinvokechannel-args
    }
  }

  get isElectron(): boolean {
    return !!(window && window.process && window.process.type);
  }

  readFile(path: string): Observable<string>{
    const requestId = generateUUID();
    return defer(() => new Promise<string>((resolve) => {
      this.ipcRenderer.once(`read-file-${requestId}-reply`, (_, result: string) => {
        console.log(`read-file-${requestId}-reply`, path);
        resolve(result);
      });

      this.ipcRenderer.send('read-file', path, requestId);
    })).pipe(take(1));
  }

  createFile(path: string){
    const requestId = generateUUID();
    return defer(() => new Promise<string>((resolve) => {
      path = `${path}`;/* .txt */
      this.ipcRenderer.once(`create-file-${requestId}-reply`, (_, result: string) => {
        console.log(`create-file-${requestId}-reply`, path, _, result);
        resolve(result);
      });

      this.ipcRenderer.send('create-file', path, requestId);
    })).pipe(take(1));
  }

  writeFile(path: string, payload: string){
    const requestId = generateUUID();
    return defer(() => new Promise<string>((resolve) => {
      path = `${path}`;
      this.ipcRenderer.once(`update-file-${requestId}-reply`, (_, result: string) => {
        console.log(`update-file-${requestId}-reply`, path, _, result);
        resolve(result);
      });

      this.ipcRenderer.send('update-file', path, payload, requestId);
    })).pipe(take(1));
  }

  removeFile(path: string): Observable<void>{
    const requestId = generateUUID();
    return defer(() => new Promise<void>((resolve) => {
      this.ipcRenderer.once(`remove-file-${requestId}-reply`, (_) => {
        console.log(`remove-file-${requestId}-reply`, path);
        resolve();
      });

      this.ipcRenderer.send('remove-file', path, requestId);
    })).pipe(take(1));
  }

  createFolder(path: string){
    const requestId = generateUUID();
    return defer(() => new Promise<string>((resolve) => {
      this.ipcRenderer.once(`create-directory-${requestId}-reply`, (_, result: string) => {
        console.log(`create-directory-${requestId}-reply`, path);
        resolve(result);
      });

      this.ipcRenderer.send('create-directory', path, requestId);
    })).pipe(take(1));
  }

  removeFolder(path: string): Observable<void>{
    const requestId = generateUUID();
    return defer(() => new Promise<void>((resolve) => {
      this.ipcRenderer.once(`remove-directory-${requestId}-reply`, (_) => {
        console.log(`remove-directory-${requestId}-reply`, path);
        resolve();
      });

      this.ipcRenderer.send('remove-directory', path, requestId);
    })).pipe(take(1));
  }

  renameFilerOrFolder(oldPath: string, newPath: string): Observable<string>{
    const requestId = generateUUID();
    return defer(() => new Promise<string>((resolve) => {
      this.ipcRenderer.once(`rename-file-folder-${requestId}-reply`, (_, result) => {
        console.log(`rename-file-folder-${requestId}-reply`, oldPath, newPath);
        resolve(result);
      });

      this.ipcRenderer.send('rename-file-folder', oldPath, newPath, requestId);
    }))/* .pipe(take(1)); */
  }

  moveFilerOrFolder(oldPath: string, newPath: string): Observable<string>{
    const requestId = generateUUID();
    return defer(() => new Promise<string>((resolve) => {
      this.ipcRenderer.once(`move-file-folder-${requestId}-reply`, (_, result) => {
        console.log(`move-file-folder-${requestId}-reply`, oldPath, newPath);
        resolve(result);
      });

      this.ipcRenderer.send('move-file-folder', oldPath, newPath, requestId);
    })).pipe(take(1));
  }

  openFolderDialog(): Observable<OpenDialogReturnValue> {
    return defer(() => new Promise<OpenDialogReturnValue>((resolve) => {
      this.ipcRenderer.once('folder-dialog-reply', (_, result: OpenDialogReturnValue) => {
        resolve(result);
      });

      this.ipcRenderer.send('open-folder-dialog');
    })).pipe(take(1));
  }

  getFolderContent(path: string): Observable<FileSystemElement[]>{
    return defer(() => new Promise<FileSystemElement[]>((resolve) => {
      this.ipcRenderer.once('get-folder-content-reply', (_, result) => {
        resolve(result);
      });

      this.ipcRenderer.send('get-folder-content', path);
    })).pipe(take(1));
  }

  createProjectStructure(path: string, name: string): Observable<CreateProjectReply>{
    return defer(() =>new Promise<CreateProjectReply>((resolve) => {
      this.ipcRenderer.once('create-project-reply', (_, result) => {
        resolve(result);
      });

      this.ipcRenderer.send('create-project', path, name);
    })).pipe(take(1));
  }

  getAllFoldersContent(path: string): Observable<FolderStructure[]>{
    return defer(() => new Promise<FolderStructure[]>((resolve)=>{
      const start = performance.now();
      this.ipcRenderer.once('get-folder-content-rec-reply', (_, result: FolderStructure[]) => {
        console.log('time ' + (performance.now() - start) );
        console.log('get-folder-content-rec-reply', result);
        resolve(result);
      });
      this.ipcRenderer.send('get-folder-content-rec', path);
    })).pipe(take(1));
  }

}
