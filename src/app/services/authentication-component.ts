import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  constructor(private http: HttpClient) {}

  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post('/api/users/login', { username, password });
  }

  logout(): Observable<boolean> {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUserRole');
    localStorage.removeItem('currentUsername');
    return of(true);
  }
}
