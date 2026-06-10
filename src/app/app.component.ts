import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <router-outlet></router-outlet>
    <app-toast-container></app-toast-container>
  `,
})
export class AppComponent {}
