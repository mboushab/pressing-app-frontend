import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Clothe } from '../types/clothes';

@Injectable({
  providedIn: 'root',
})
export class ClothesList {
  private http = inject(HttpClient);

  getClothes() {
    return this.http.get<Clothe[]>('/api/clothes');
  }

  updateClothes(clothes: Partial<Pick<Clothe, 'name' | 'price'>>, id: number) {
    return this.http.patch<Clothe>(`/api/clothes/${id}`, clothes);
  }

  createClothes(clothes: Pick<Clothe, 'name' | 'price'>) {
    return this.http.post<Clothe>('/api/clothes/create', clothes);
  }

  deleteClothes(id: number) {
    return this.http.delete(`/api/clothes/${id}`);
  }
}
