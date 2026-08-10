import { TestBed } from '@angular/core/testing';

import { ClothesList } from './clothes-list';

describe('ClothesList', () => {
  let service: ClothesList;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClothesList);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
