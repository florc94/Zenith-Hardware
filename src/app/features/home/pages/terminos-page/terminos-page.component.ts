import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-terminos-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './terminos-page.component.html',
  styleUrl: './terminos-page.component.scss'
})
export class TerminosPageComponent {}