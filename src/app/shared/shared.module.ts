import { TabsComponent } from './components/tabs/tabs.component';
import { HierarchyMenuComponent } from './components/hierarchy-menu/hierarchy-menu.component';
import { HierarchyMenuItemComponent } from './components/hierarchy-menu/hierarchy-menu-item/hierarchy-menu-item.component';
import { EditorComponent } from './components/editor/editor.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';

import { PageNotFoundComponent } from './components/';
import { WebviewDirective } from './directives/';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TextEditorIndexComponent } from './components/text-editor-index/text-editor-index.component';
import { WritingDesktopComponent } from './components/writing-desktop/writing-desktop.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { AutoFocusModule } from 'primeng/autofocus';
import { ButtonModule } from 'primeng/button';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { ContextMenuModule } from 'primeng/contextmenu';
import { DialogModule } from 'primeng/dialog';
import { FocusTrapModule } from 'primeng/focustrap';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { MenubarModule } from 'primeng/menubar';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { PanelModule } from 'primeng/panel';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { TabMenuModule } from 'primeng/tabmenu';
import { TreeModule } from 'primeng/tree';
import { SplitterModule } from 'primeng/splitter';
import { DialogService } from 'primeng/dynamicdialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { MessagesModule } from 'primeng/messages';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { AlertServiceService } from './services/alert-service.service';
import { ExecutePipe } from './pipes/execute.pipe';
import { NotesContainerComponent } from './components/writing-desktop/notes-container/notes-container.component';
import { FormNoteComponent } from './components/writing-desktop/form-note/form-note.component';

@NgModule({
  declarations: [
    PageNotFoundComponent,
    WebviewDirective,
    EditorComponent,
    HierarchyMenuItemComponent,
    HierarchyMenuComponent,
    TabsComponent,
    TextEditorIndexComponent,
    WritingDesktopComponent,
    ExecutePipe,
    NotesContainerComponent,
    FormNoteComponent,
  ],
  providers: [DialogService, MessageService, AlertServiceService, ConfirmationService],
  imports: [
    CommonModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    MenubarModule,
    PanelModule,
    ButtonModule,
    FocusTrapModule,
    ContextMenuModule,
    OverlayPanelModule,
    TabMenuModule,
    ScrollPanelModule,
    DialogModule,
    InputTextModule,
    TreeModule,
    MenuModule,
    ConfirmPopupModule,
    AutoFocusModule,
    DragDropModule,
    SplitterModule,
    ConfirmDialogModule,
    MessagesModule,
    MessageModule,
    ToastModule
  ],
  exports: [
    TranslateModule,
    WebviewDirective,
    FormsModule,
    HierarchyMenuComponent,
    TabsComponent,
    TextEditorIndexComponent,
    WritingDesktopComponent,
    MenubarModule,
    PanelModule,
    ButtonModule,
    FocusTrapModule,
    ContextMenuModule,
    OverlayPanelModule,
    TabMenuModule,
    ScrollPanelModule,
    DialogModule,
    InputTextModule,
    TreeModule,
    MenuModule,
    ConfirmPopupModule,
    AutoFocusModule,
    DragDropModule,
    SplitterModule,
    ConfirmDialogModule,
    MessagesModule,
    MessageModule,
    ToastModule
  ],
})
export class SharedModule {}
