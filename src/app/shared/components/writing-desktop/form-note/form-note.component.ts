import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProjectNote } from '../../../models/project.model';
import SunEditor from 'suneditor/src/lib/core';
@Component({
  selector: 'app-form-note',
  templateUrl: './form-note.component.html',
  styleUrls: ['./form-note.component.scss']
})
export class FormNoteComponent {
  @Input() isUpdate = false;
  @Input() visible = false;
  _note?: ProjectNote;
  @Input() set note(value: ProjectNote | undefined){
    this._note = value;
    if(this._note){
      this.form.setValue({
        id: this._note.id,
        title: this._note.title,
        position: this._note.position
      });
    } else {
      this.form.reset();
    }
  }
  @Input() notes: ProjectNote[] = [];

  @Output() confirmNote: EventEmitter<ProjectNote> = new EventEmitter();
  @Output() close: EventEmitter<void> = new EventEmitter();

  editor: SunEditor;
  form: FormGroup;
  ready: boolean = false;
  constructor(private fb: FormBuilder){
    this.form = fb.group({
      id: [null, Validators.required],
      title: [null, [Validators.required, this.validateTitle()]],
      position: [0, Validators.required]
    });
  }

  validateTitle(){
    return (control: AbstractControl) => {
      const noteWithSameTitle = this.notes.find( n =>
        n.id !== this._note?.id
        && n.title === control.value
      );
      if(noteWithSameTitle){
        return { sameTitle: 'Same Title' };
      }
      return null;
    }
  }

  onNoteEditorReady(editor){
    this.editor = editor;
  }

  closeCreateNote(){
    this.form.reset();
    this._note = undefined;
    this.visible = false;
    this.ready = false;
    this.close.emit();
  }

  onConfirm(){
    const note = {...this.form.value};
    /* this.editor.save().then( data => {
      note.data = data;
      this.confirmNote.emit(note);
      this.closeCreateNote();
    }); */
    note.data = this.editor.getContents(true);
    this.confirmNote.emit(note);
    this.closeCreateNote();
  }

  onShow(){
    this.ready = true;
  }
}
