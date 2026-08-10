import { Component } from '@angular/core';

@Component({
  selector: 'app-clothes-component',
  imports: [],
  templateUrl: './clothes-component.html',
  styleUrl: './clothes-component.css',
})
export class ClothesComponent {
  clothes = [
    { id: 1, name: 'T-shirt', price: 20 },
    { id: 2, name: 'Jeans', price: 50 },
    { id: 3, name: 'Jacket', price: 100 },
    { id: 4, name: 'Dress', price: 80 },
    { id: 5, name: 'Sweater', price: 40 },
  ];
}
