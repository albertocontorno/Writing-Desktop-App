import { OutputData } from '@editorjs/editorjs';
import { Observable, forkJoin, tap } from 'rxjs';
import { ProjectNote } from '../../../models/project.model';
import { ProjectService } from '../../../services/project.service';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MenuItem, PrimeIcons } from 'primeng/api';
import edjsHTML from 'editorjs-html';
import { Menu } from 'primeng/menu';
@Component({
  selector: 'app-notes-container',
  templateUrl: './notes-container.component.html',
  styleUrls: ['./notes-container.component.scss']
})
export class NotesContainerComponent implements OnInit {
  _notesIndex: ProjectNote[];
  @Input() set notesIndex (value: ProjectNote[]){
    this._notesIndex = value;
    this.loadNotes();
  };
  get notesIndex(){
    return this._notesIndex;
  }

  @Output() noteChangePosition: EventEmitter<{id: string, position: number}> = new EventEmitter();

  noteMenu: MenuItem[] = [
    {
      label: 'Edit',
      icon: PrimeIcons.FILE_EDIT,
      command: () => this.editNote(),

    },
    {
      label: 'Delete',
      icon: PrimeIcons.TRASH,
      command: () => this.deleteNote()
    },
    {
      label: 'Move Up',
      icon: PrimeIcons.ARROW_UP,
      command: () => this.moveNoteUp()
      
    },
    {
      label: 'Move Down',
      icon: PrimeIcons.ARROW_DOWN,
      command: () => this.moveNoteDown()
    }
  ];

  index = -1;
  notes: ProjectNote[] = [];
  isEditNoteVisibile: boolean = false;
  editingNote?: ProjectNote;
  toHtml;
  constructor(private projectService: ProjectService, private cd: ChangeDetectorRef){
    this.toHtml = edjsHTML().parse;
    this.projectService.onChange$.subscribe( changes => {
      this.notesIndex = changes.project.notes;
    });
  }

  ngOnInit(){
    this.loadNotes();
  }
  

  openMenu(e, menu: Menu, index: number){
    menu.toggle(e);
    this.index = index;
  }

  loadNotes(){
    const obs$: Observable<string>[] = [];
    this.notesIndex.forEach( note => {
      if(!this.notes.find(n => n.id === note.id)){
        const newNote = {...note};
        this.notes.push(newNote);
        obs$.push(this.projectService.readNote(note.title).pipe(
          tap( data => {
            const noteParsed = JSON.parse(data) as OutputData & {id: string};
            const found = this.notesIndex.find( n => n.id === noteParsed.id );
            if(found){
              newNote.data = noteParsed;
            }
          })
        ));
      }
    });
    if(obs$.length){
      forkJoin(obs$).subscribe( _ => {
        console.log('notes loaded', this.notes, this.notesIndex);
        this.cd.detectChanges();
      });
    }
  }

  editNote(){
    this.isEditNoteVisibile = true;
    this.editingNote = this.notes[this.index];
  }

  onUpdateNote(note: ProjectNote){
    console.log(note, this.notesIndex[this.index]);
    const oldTitle = this.notesIndex[this.index].title
    this.editingNote!.title = note.title;
    this.editingNote!.data = note.data;
    this.notesIndex[this.index].title = note.title;
    this.projectService.updateNote(oldTitle, note.title, {id: note.id, ...note.data}).subscribe(
      res => {
        console.log('note updated', res)
        this.reset();
      }
    )
  }

  deleteNote(){
    console.log('delete note', this.index);
    this.notes.splice(this.index, 1);
    const noteToDelete = this.notesIndex.splice(this.index, 1)[0];
    for(let i=this.index; i<this.notes.length; i++){
      this.notes[i].position--;
      this.notesIndex[i].position--;
    }
    this.projectService.removeNote(noteToDelete.title);
  }

  moveNoteUp(){
    const prevIndex = this.index! - 1;
    if(prevIndex >= 0){
      let temp = this.notes[prevIndex];
      temp.position++;
      this.notes[this.index].position--;
      this.notes[prevIndex] = this.notes[this.index];
      this.notes[this.index] = temp;

      temp = this.notesIndex[prevIndex];
      temp.position++;
      this.notesIndex[this.index].position--;
      this.notesIndex[prevIndex] = this.notesIndex[this.index];
      this.notesIndex[this.index] = temp;

      this.projectService.saveProject();
    }
  }

  moveNoteDown(){
    const nextIndex = this.index! + 1;
    if(nextIndex < this.notes.length){
      let temp = this.notes[nextIndex];
      temp.position--;
      this.notes[this.index].position++;
      this.notes[nextIndex] = this.notes[this.index];
      this.notes[this.index] = temp;

      temp = this.notesIndex[nextIndex];
      temp.position--;
      this.notesIndex[this.index].position++;
      this.notesIndex[nextIndex] = this.notesIndex[this.index];
      this.notesIndex[this.index] = temp;

      this.projectService.saveProject();

    }
  }

  reset(){
    this.editingNote = undefined;
    this.isEditNoteVisibile = false;
  }
}
