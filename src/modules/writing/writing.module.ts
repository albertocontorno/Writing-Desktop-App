import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SplitterModule } from 'primeng/splitter';
import { SharedModule } from '../../app/shared/shared.module';



@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    SharedModule,
    SplitterModule
  ],
  exports: []
})
export class WritingModule { }
