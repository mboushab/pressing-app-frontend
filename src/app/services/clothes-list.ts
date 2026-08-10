import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Clothe } from '../types/clothes';

@Injectable({
  providedIn: 'root',
})
export class ClothesList {
  private http = inject(HttpClient);

  getClothes() {
    return this.http.get('http://localhost:3000/api/clothes');
  }

  updateClothes(clothes: Clothe, id: number) {
    return this.http.put(`http://localhost:3000/api/clothes/${id}`, clothes);
  }

  createClothes(clothes: Clothe) {
    return this.http.post('http://localhost:3000/api/clothes', clothes);
  }

  deleteClothes(id: number) {
    return this.http.delete(`http://localhost:3000/api/clothes/${id}`);
  }
}
