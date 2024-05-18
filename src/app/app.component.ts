import { ProjectService } from './shared/services/project.service';
import { Component, OnInit } from '@angular/core';
import { ElectronService } from './shared/services';
import { TranslateService } from '@ngx-translate/core';
import { APP_CONFIG } from '../environments/environment';
import { MenuItem, MessageService } from 'primeng/api';
import { AlertServiceService } from './shared/services/alert-service.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: []
})
export class AppComponent implements OnInit{
  items: MenuItem[];
  createProjectDialogVisible = false;
  constructor(
    private electronService: ElectronService,
    private projectService: ProjectService,
    private translate: TranslateService,
    private messageService: AlertServiceService
  ) {
    this.translate.setDefaultLang('en');
    console.log('APP_CONFIG', APP_CONFIG);

    if (electronService.isElectron) {
      console.log(process.env);
    } else {
      console.log('Run in browser');
    }
  }
  ngOnInit(): void {
    this.items = [
      {
        label: 'Project',
        items: [
          {
            label: 'New', 
            icon: 'pi pi-fw pi-plus',
            command: () => {
              this.createProjectDialogVisible = true;
            }
          },
          {
            label: 'Open', 
            icon: 'pi pi-fw pi-folder',
            command: () => {
              this.electronService.openFolderDialog().subscribe( selection => {
                if(!selection.canceled){
                  this.electronService.getFolderContent(selection.filePaths[0]).subscribe(
                    folderContent => {
                      console.log(folderContent);
                      if(folderContent.find( f => f.name === 'wa_project.json')){
                        this.projectService.load(selection.filePaths[0]).subscribe( res => {
                          console.log('Project loaded');
                        });
                      }
                    }
                  );
                }
              });
            }
          },
        ]
      }
    ];
  }


  onConfirmCreateProject(info: {name: string, path: string}){
    this.electronService.createProjectStructure(info.path, info.name).subscribe( (value) => {
      console.log(value);
      this.createProjectDialogVisible = false;
      this.messageService.success('PROJECT.CREATION.SUCCESS', 'COMMON.SUCCESS', { name: info.name });
      this.projectService.set(value.project, value.settings);
    });
  }
}
