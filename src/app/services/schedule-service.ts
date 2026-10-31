import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Closure, OpeningRange, ReceptionPause, Schedule } from '../types/schedule';

/** Opening hours, closures and reception of the current pressing. */
@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private readonly http = inject(HttpClient);

  get() {
    return this.http.get<Schedule>('/api/center/schedule');
  }

  setHours(hours: OpeningRange[]) {
    return this.http.put<Schedule>('/api/center/hours', { hours });
  }

  /** Collections planned that day are called off; their customers choose again. */
  addClosure(day: string, reason: string | null) {
    return this.http.post<{ closure: Closure; collections_called_off: number; deliveries_to_move: number }>(
      '/api/center/closures',
      { day, reason },
    );
  }

  removeClosure(id: string) {
    return this.http.delete(`/api/center/closures/${id}`);
  }

  setReception(pause: ReceptionPause) {
    return this.http.put<Schedule>('/api/center/reception', { pause });
  }
}
