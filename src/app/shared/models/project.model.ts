import { OutputData } from "@editorjs/editorjs";

/* export interface Project {
  id: string;
  name: string;
  pages: TextEditorPage[];
  notes: TextEditorNote[];
  references: TextEditoreReference[];
} */

export interface Project{
  id: string;
  name: string;
  extras?: any;
  notes: TextEditorNote[];
  files: ProjectFile[];
  references?: any[];
  rootPath: string;
}

export interface ProjectFile{
  id: string;
  name: string;
  type: 'FOLDER' | 'FILE';
  path:  string;
  collapsed?: boolean;
  icon?: string;
  children?: ProjectFile[];
  blocks?: any[];
  isEditing?: boolean;// internal
  position: number;
  
  data: OutputData;
}
export interface TextEditorPage {
  id: string;
  title: string;
  position: number;
  blocks: any[];
}
export interface TextEditorNote {
  id: string;
  title: string;
  blocks?: any[];
}
export interface TextEditorIndex {
  id: string;
}