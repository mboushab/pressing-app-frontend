import { Injectable } from '@angular/core';
import { User } from '../types/authenticate';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

/** A pressing the user belongs to, as returned at login. */
export interface UserCenter {
  id: string;
  name: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
  role: 'CENTER_ADMIN' | 'CENTER_STAFF';
}

const CENTER_ID_KEY = 'currentCenterId';
const CENTER_ROLE_KEY = 'currentCenterRole';

export interface UserSummary {
  id: string;
  username: string;
  role: 'ADMIN' | 'USER';
  created_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private http: HttpClient) {}

  getUserRole(): string {
    return localStorage.getItem('currentUserRole') || '';
  }

  /** Admin of the current pressing (dashboard, team, deletions). */
  isAdmin(): boolean {
    return localStorage.getItem(CENTER_ROLE_KEY) === 'CENTER_ADMIN';
  }

  /** Member of a pressing: its pages (invoices, clients, prices…) are open. */
  hasCenter(): boolean {
    return this.getCenterId() !== null;
  }

  /** First page after sign-in: the pressings for the platform admin, the dashboard for a pressing admin. */
  homePath(): string {
    if (!this.hasCenter()) return this.isPlatformAdmin() ? '/app/pressings' : '/login';
    return this.isAdmin() ? '/app/home' : '/app/invoices';
  }

  /** Administrator of the whole platform (delivery slots and fees, couriers). */
  isPlatformAdmin(): boolean {
    return this.getUserRole().toUpperCase() === 'ADMIN';
  }

  /** Pressing sent with every request (X-Center-Id), or null to let the server pick the only one. */
  getCenterId(): string | null {
    return localStorage.getItem(CENTER_ID_KEY);
  }

  /** Remembers the pressing to work in: the first active one. */
  setCenters(centers: UserCenter[]): void {
    const center = centers.find((c) => c.status === 'ACTIVE') ?? centers[0];
    if (center) {
      localStorage.setItem(CENTER_ID_KEY, center.id);
      localStorage.setItem(CENTER_ROLE_KEY, center.role);
    } else {
      this.clearCenter();
    }
  }

  clearCenter(): void {
    localStorage.removeItem(CENTER_ID_KEY);
    localStorage.removeItem(CENTER_ROLE_KEY);
  }

  getUsername(): string {
    return localStorage.getItem('currentUsername') || '';
  }

  getUsers(): Observable<UserSummary[]> {
    return this.http
      .get<{ success: boolean; users: UserSummary[] }>('/api/users/list')
      .pipe(map((res) => res.users));
  }

  addNewUser(user: Omit<User, 'id'>): Observable<any> {
    return this.http.post('/api/users/register', user);
  }
}
