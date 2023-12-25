import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextEditorIndexComponent } from './text-editor-index.component';

describe('TextEditorIndexComponent', () => {
  let component: TextEditorIndexComponent;
  let fixture: ComponentFixture<TextEditorIndexComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TextEditorIndexComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TextEditorIndexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
