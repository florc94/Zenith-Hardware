import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-devoluciones-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './devoluciones-page.component.html',
  styleUrl: './devoluciones-page.component.scss'
})
export class DevolucionesPageComponent {}