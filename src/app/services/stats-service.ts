import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { DashboardStats } from '../types/stats';

@Injectable({ providedIn: 'root' })
export class StatsService {
  private readonly http = inject(HttpClient);

  /** from/to are calendar days (YYYY-MM-DD), both included. Admin only. */
  getDashboard(from: string, to: string) {
    return this.http.get<DashboardStats>(`/api/stats/dashboard?from=${from}&to=${to}`);
  }
}
