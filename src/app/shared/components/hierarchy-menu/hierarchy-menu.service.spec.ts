import { TestBed } from '@angular/core/testing';

import { HierarchyMenuService } from './hierarchy-menu.service';

describe('HierarchyMenuService', () => {
  let service: HierarchyMenuService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HierarchyMenuService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
