import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, distinct, distinctUntilChanged } from 'rxjs';
import { ProjectFile } from '../../models/project.model';

@Component({
  selector: 'app-file-search',
  templateUrl: './file-search.component.html',
  styleUrls: ['./file-search.component.scss']
})
export class FileSearchComponent {
  @Input() files: ProjectFile[] = [];
  @Output() onOpenFile: EventEmitter<ProjectFile> = new EventEmitter();

  form: FormGroup;
  filteredFiles: ProjectFile[] = [];

  constructor(private fb: FormBuilder){
    this.form = fb.group({
      filename: ['']
    });

    this.form.get('filename')?.valueChanges.pipe(
      distinctUntilChanged(),
      debounceTime(200),
    ).subscribe( res => this.onFileNameChanged() );
  }

  onFileNameChanged(){
    const filename = this.form.get('filename')?.value;
    if(filename?.length){
      const filteredFiles = [];
      this.filterFilesByName(this.files, filteredFiles);
      this.filteredFiles = filteredFiles;
    } else {
      this.filteredFiles = [];
    }

  }

  filterFilesByName(file: ProjectFile[], files: ProjectFile[]) {
    for(let i = 0; i<file.length; i++){
      if(file[i].type === 'FILE' && file[i].name.toLowerCase().includes(this.form.get('filename')?.value.toLowerCase())) files.push(file[i]);
      if(file[i].children && file[i].children!.length > 0) this.filterFilesByName(file[i].children!, files);
    }
  }

  openFile(file: ProjectFile){
    this.form.reset();
    this.onOpenFile.emit(file);
  }
}
