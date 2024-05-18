import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ElectronService } from '../../../shared/services';
import { Message } from 'primeng/api';
import { FileSystemElement } from '../../../../../app/models/FileSystemElement.model';

@Component({
  selector: 'app-form-create-project',
  templateUrl: './form-create-project.component.html',
  styleUrls: ['./form-create-project.component.scss']
})
export class FormCreateProjectComponent {

  form: FormGroup<{
    projectName: FormControl<string | null>,
    directory: FormControl<string | null>
  }>;

  messages: Message[] = [
    { severity: 'error', summary: 'Error', detail: 'This folder already contains a project!' }
  ];
  showMessages = false;

  @Output() confirmCreation: EventEmitter<{path: string, name: string}> = new EventEmitter();

  constructor(fb: FormBuilder, private electronService: ElectronService){
    this.form = fb.group({
      projectName: ['', Validators.required],
      directory: ['', Validators.required]
    });

    this.form.controls.directory.valueChanges.subscribe( res => this.showMessages = false );
  }

  openChooseDirectory(){
    this.electronService.openFolderDialog().subscribe( res => {
      this.form.controls.directory.patchValue(res.canceled ? null : res.filePaths[0]);
    });
  }

  confirm(){
    if(this.form.valid){
      const value = {
        name: this.form.value.projectName!,
        path: this.form.value.directory!
      };
      this.electronService.getFolderContent(value.path).subscribe( (r: FileSystemElement[]) => {
        if(r.find( f => f.name === 'wa_project.json')){
          this.showMessages = true;
        } else {
          this.confirmCreation.emit(value);
        }
      });
      
    }
  }

}
