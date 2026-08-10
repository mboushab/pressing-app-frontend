import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  constructor(private http: HttpClient) {}

  isAuthenticated(): boolean {
    // Implement your authentication logic here
    // For example, check if a valid token exists in local storage
    const token = localStorage.getItem('authToken');
    return !!token; // Return true if token exists, false otherwise
  }

  login(username: string, password: string): Observable<any> {
    // send login request to server and get token
    return this.http.post('http://localhost:3000/api/users/login', { username, password });
  }

  logout(): Observable<any> {
    // Clear the authentication token from local storage
    localStorage.removeItem('authToken');
    return of(true);
  }
}
