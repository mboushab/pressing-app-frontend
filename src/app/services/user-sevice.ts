import { Injectable } from '@angular/core';
import { User } from '../types/authenticate';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private http: HttpClient) {}

  getUserRole(): string {
    return localStorage.getItem('currentUserRole') || '';
  }

  addNewUser(user: User): Observable<any> {
    return this.http.post('/api/users/register', user, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
