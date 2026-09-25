import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../../components/navbar/navbar';
import { Toasts } from '../../shared/toast/toast';
import { ConfirmDialog } from '../../shared/confirm/confirm-dialog';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, Navbar, Toasts, ConfirmDialog],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayout {}
