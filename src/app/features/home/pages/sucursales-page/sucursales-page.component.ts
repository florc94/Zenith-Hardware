import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-sucursales-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './sucursales-page.component.html',
  styleUrl: './sucursales-page.component.scss'
})
export class SucursalesPageComponent {}