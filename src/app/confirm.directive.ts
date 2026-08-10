import { Directive, HostListener, Input } from '@angular/core';

@Directive({
  selector: 'a[confirm]',
})
export class ConfirmDirective {
  constructor() {}
  text: string = 'Es tu sur?';

  @Input('confirm-message')
  set confirmMessage(value: any) {
    this.text = value;
  }

  @HostListener('click')
  onClick(): boolean {
    return confirm(this.text);
  }
}
