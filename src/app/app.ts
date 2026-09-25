import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { I18nService } from './shared/i18n/i18n.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  // applies the saved language (lang/dir on <html>) from the first screen
  protected readonly i18n = inject(I18nService);
}
