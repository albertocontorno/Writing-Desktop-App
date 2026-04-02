import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileSearchComponent } from './file-search.component';

describe('FileSearchComponent', () => {
  let component: FileSearchComponent;
  let fixture: ComponentFixture<FileSearchComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FileSearchComponent]
    });
    fixture = TestBed.createComponent(FileSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
