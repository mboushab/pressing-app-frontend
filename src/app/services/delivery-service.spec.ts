import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { DeliveryService } from './delivery-service';

describe('DeliveryService', () => {
  let service: DeliveryService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DeliveryService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('asks for the slots of a pressing over a period', () => {
    service.getSlots('c1', '2026-11-02', '2026-11-08').subscribe();
    const req = http.expectOne((r) => r.url === '/api/admin/slots');
    expect(req.request.params.get('center_id')).toBe('c1');
    expect(req.request.params.get('from')).toBe('2026-11-02');
    expect(req.request.params.get('to')).toBe('2026-11-08');
    req.flush([]);
  });

  it('sets a default fee without a pressing', () => {
    service.setDefaultFee('RETURN', 150).subscribe();
    const req = http.expectOne('/api/admin/fee-rules');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ leg: 'RETURN', amount: 150 });
    req.flush({});
  });
});
