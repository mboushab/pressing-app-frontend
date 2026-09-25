import { Component, input, model } from '@angular/core';
import { classNames } from '../../shared/styles/class-names';
import { MatIcon } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-component',
  imports: [MatIcon, FormsModule],
  templateUrl: './search-component.html',
  styleUrl: './search-component.css',
  standalone: true,
})
export class SearchComponent {
  placeholder = input.required<string>();

  search = model<string>('');

  classNames = classNames;
}
