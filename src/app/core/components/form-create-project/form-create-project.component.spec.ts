import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormCreateProjectComponent } from './form-create-project.component';

describe('FormCreateProjectComponent', () => {
  let component: FormCreateProjectComponent;
  let fixture: ComponentFixture<FormCreateProjectComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FormCreateProjectComponent]
    });
    fixture = TestBed.createComponent(FormCreateProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
