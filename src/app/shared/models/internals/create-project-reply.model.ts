import { ProjectSettings } from "../ProjectSettings.model";
import { Project } from "../project.model";

export interface CreateProjectReply {
  project: Project;
  settings: ProjectSettings;
}