import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-envios-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './envios-page.component.html',
  styleUrl: './envios-page.component.scss'
})
export class EnviosPageComponent {}