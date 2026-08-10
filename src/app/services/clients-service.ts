import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, switchMap, startWith, shareReplay } from 'rxjs';
import { Client } from '../types/authenticate';

@Injectable({
  providedIn: 'root',
})
export class ClientsService {
  constructor(private http: HttpClient) {}

  getClients(): Observable<Client[]> {
    return this.http.get<Client[]>('/api/clients');
  }

  createClient(client: Client): Observable<any> {
    return this.http.post('/api/clients/create-client', client, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  deleteClient(id: string | undefined): Observable<any> {
    return this.http.delete('/api/clients/delete/' + id);
  }
}
