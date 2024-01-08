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
  notes: ProjectNote[];
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
export interface ProjectNote {
  id: string;
  title: string;
  position: number;
  data?: any; // internal
}
export interface TextEditorIndex {
  id: string;
}