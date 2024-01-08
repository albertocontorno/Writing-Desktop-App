import { ProjectSettings } from "../ProjectSettings.model";
import { Project } from "../project.model";

export interface ProjectInfoChanges{
  project: Project;
  settings: ProjectSettings;
}