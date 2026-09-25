import { Injectable } from '@angular/core';
import { User } from '../types/authenticate';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

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

  isAdmin(): boolean {
    return this.getUserRole().toUpperCase() === 'ADMIN';
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
