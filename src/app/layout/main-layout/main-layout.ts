import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../../components/navbar/navbar';
import { Toasts } from '../../shared/toast/toast';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, Navbar, Toasts],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayout {}
