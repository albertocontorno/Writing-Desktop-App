export class FolderStructure {
  constructor(public readonly path: string, public readonly  name: string, public readonly  type: 'FOLDER' | 'FILE' | 'SYMLINK', public readonly  children?: FolderStructure[]){}
}