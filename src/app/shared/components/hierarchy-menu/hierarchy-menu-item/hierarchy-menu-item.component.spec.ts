import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HierarchyMenuItemComponent } from './hierarchy-menu-item.component';

describe('HierarchyMenuItemComponent', () => {
  let component: HierarchyMenuItemComponent;
  let fixture: ComponentFixture<HierarchyMenuItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HierarchyMenuItemComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HierarchyMenuItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
