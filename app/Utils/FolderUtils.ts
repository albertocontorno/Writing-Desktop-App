import * as path from 'path';
import * as fs from 'fs/promises';
import { FolderStructure } from "../models/FolderStructure.model";

export async function directory_read(dirPath: string, filelist: FolderStructure[] = []) {
  const files = await fs.readdir(dirPath, { withFileTypes: true });

  for (let file of files) {
    const filepath = path.join(dirPath, file.name);

    if (file.isDirectory()) {
      const children = [];
      filelist.push( new FolderStructure(filepath, file.name, 'FOLDER', children));
      await directory_read(filepath, children);
    } else if(file.isSymbolicLink()){
      filelist.push( new FolderStructure(filepath, file.name, 'SYMLINK'));
    }
    else {
      filelist.push( new FolderStructure(filepath, file.name, 'FILE'));
    }
  }

  return filelist;
}