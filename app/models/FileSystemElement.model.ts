export class FileSystemElement {
  constructor(public readonly path: string, public readonly name: string, public readonly type: 'FILE' | 'FOLDER' | 'SYMLINK'){}
}