import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Client } from '../types/authenticate';

@Injectable({
  providedIn: 'root',
})
export class ClientsService {
  constructor(private http: HttpClient) {}

  getClients(): Observable<Client[]> {
    return this.http.get<Client[]>('/api/clients');
  }

  searchClients(query: string): Observable<Client[]> {
    return this.http.get<Client[]>(`/api/clients?search=${encodeURIComponent(query)}`);
  }

  createClient(client: Client): Observable<{ clientId: string }> {
    return this.http.post<{ clientId: string }>('/api/clients/create-client', client);
  }

  deleteClient(id: string | undefined): Observable<any> {
    return this.http.delete('/api/clients/delete/' + id);
  }
}
