import {app, BrowserWindow, screen, ipcMain, dialog, ipcRenderer} from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as fsL from 'fs';
import * as fsExtra from 'fs-extra';
import { randomUUID } from 'crypto';
import { FolderStructure } from './models/FolderStructure.model';
import { directory_read } from './Utils/FolderUtils';
import { FileSystemElement } from './models/FileSystemElement.model';

let win: BrowserWindow | null = null;
const args = process.argv.slice(1),
  serve = args.some(val => val === '--serve');

function createWindow(): BrowserWindow {

  const size = screen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  win = new BrowserWindow({
    x: 0,
    y: 0,
    width: size.width,
    height: size.height,
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: (serve),
      contextIsolation: false,
    },
  });

  if (serve) {
    const debug = require('electron-debug');
    debug();

    require('electron-reloader')(module);
    win.loadURL('http://localhost:4200');
  } else {
    // Path when running electron executable
    let pathIndex = './index.html';

    if (fsL.existsSync(path.join(__dirname, '../dist/index.html'))) {
       // Path when running electron in local folder
      pathIndex = '../dist/index.html';
    }

    const url = new URL(path.join('file:', __dirname, pathIndex));
    win.loadURL(url.href);
  }

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  return win;
}

try {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
  app.on('ready', () => setTimeout(createWindow, 400));

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });

} catch (e) {
  // Catch Error
  // throw e;
}

ipcMain.on('read-file', (event, path: string, requestId: string, encoding: string = 'utf-8') => {
  fs.readFile(path, { encoding }).then( file => {
    console.log(`read-file-${requestId}-reply`)
    event.reply(`read-file-${requestId}-reply`, file);
  });
});

ipcMain.on('create-file', (event, path: string, requestId: string, encoding: BufferEncoding = 'utf-8') => {
  fs.writeFile(path, '', { encoding }).then( file => {
    console.log(`create-file-${requestId}-reply`)
    event.reply(`create-file-${requestId}-reply`, file);
  });
});

ipcMain.on('update-file', (event, path: string, content: string, requestId: string, encoding: BufferEncoding = 'utf-8') => {
  fs.writeFile(path, content, { encoding }).then( file => {
    console.log(`update-file-${requestId}-reply`)
    event.reply(`update-file-${requestId}-reply`, file);
  });
});

ipcMain.on('remove-file', (event, path: string, requestId: string) => {
  fs.rm(path).then( file => {
    console.log(`remove-file-${requestId}-reply`)
    event.reply(`remove-file-${requestId}-reply`, file);
  });
});

ipcMain.on('create-directory', (event, path: string, requestId: string) => {
  fs.mkdir(path).then( directory => {
    console.log(`create-directory-${requestId}-reply`)
    event.reply(`create-directory-${requestId}-reply`, directory);
  });
});

ipcMain.on('remove-directory', (event, path: string, requestId: string) => {
  fs.rmdir(path, {recursive: true}).then( directory => {
    console.log(`remove-directory-${requestId}-reply`)
    event.reply(`remove-directory-${requestId}-reply`, directory);
  });
});

ipcMain.on('rename-file-folder', (event, oldPath: string, newPath: string, requestId: string) => {
  fs.rename(oldPath, newPath).then( file => {
    console.log(`rename-file--folder${requestId}-reply`)
    event.reply(`rename-file--folder${requestId}-reply`, file);
  });
});

ipcMain.on('move-file-folder', (event, oldPath: string, newPath: string, requestId: string) => {
  fsExtra.move(oldPath, newPath).then( file => {
    console.log(`move-file-folder-${requestId}-reply`)
    event.reply(`move-file-folder-${requestId}-reply`, file);
  });
});

ipcMain.on('open-folder-dialog', (event) => {
  dialog
    .showOpenDialog({
      properties: ['openDirectory'],
    })
    .then((result) => {
      event.reply('folder-dialog-reply', result);
    });
});

async function readDirectory(path: string){
  const content: any[] = [];
  const files = await fs.readdir(path, { withFileTypes: true })
  files.forEach( file => {
    const fileEntry = {
      path: `${path}/${file.name}`,
      name: file.name,
      type: file.isDirectory() ? 'FOLDER' : (file.isSymbolicLink() ? 'SYMLINK' :'FILE')
    };
    content.push(fileEntry);
  });
  return content;
}


ipcMain.on('get-folder-content', (event, path: string) => {
  const content: FileSystemElement[] = [];
  fs.readdir(path, { withFileTypes: true }).then( files => {
    files.forEach( file => {
      const filePath = `${path}/${file.name}`;
      content.push(
        new FileSystemElement(filePath, file.name, file.isDirectory() ? 'FOLDER' : (file.isSymbolicLink() ? 'SYMLINK' :'FILE'))
      );
    });
    event.reply('get-folder-content-reply', content);

  });
});

ipcMain.on('get-folder-content-rec', (event, path: string) => {
  const tree: FolderStructure[] = [];
  directory_read(path, tree).then( res => {
    event.reply('get-folder-content-rec-reply', res);
  });
});


ipcMain.on('create-project', (event, path: string, name: string) => {
  const id = randomUUID();
  const promises: any[] = [];
  const project = {
    name: name,
    id: id,
    notes: [],
    references: [],
    extras: [],
    files: [],
    rootPath: path
  };
  const settings = {
    id: id,
  }
  promises.push(
    fs.appendFile(path + '/wa_project.json', JSON.stringify(project))
  );
  promises.push(
    fs.appendFile(path + '/wa_project-settings.json', JSON.stringify(settings))
  );
  promises.push( fs.mkdir(path + '/content', ) );
  promises.push( fs.mkdir(path + '/notes', ) );
  Promise.all(promises).then( _ => {
    event.reply('create-project-reply', {project, settings})
  });
});

