import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: 'a[no-open]',
})
export class PreventDirective {
  @HostListener('click', ['$event'])
  onClick(event: Event) {
    event.preventDefault();
    console.log('Link click prevented:');
  }
}
