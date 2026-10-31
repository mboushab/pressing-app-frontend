import { Component } from '@angular/core';
import { I18N_PIPES } from '../../shared/i18n/i18n.pipes';
import { classNames } from '../../shared/styles/class-names';
import { SlotsPanel } from './slots-panel';

/** The pressing's own delivery slots, planned by its admins. */
@Component({
  selector: 'app-own-slots-page',
  imports: [...I18N_PIPES, SlotsPanel],
  template: `
    <section [class]="classNames.container">
      <div [class]="classNames.pageHeader">
        <div>
          <h1 [class]="classNames.pageTitle">{{ 'nav.slots' | t }}</h1>
          <p class="text-sm text-slate-500">{{ 'slots.subtitle' | t }}</p>
        </div>
      </div>
      <app-slots-panel [own]="true" />
    </section>
  `,
})
export class OwnSlotsPage {
  readonly classNames = classNames;
}
