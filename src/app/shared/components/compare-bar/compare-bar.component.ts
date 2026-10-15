import { CommonModule } from '@angular/common';
import { Component, computed } from '@angular/core';

import { CompareService } from '../../../features/catalog/services/compare.service';
import {
  appRoutes,
  getCurrentLanguage
} from '../../../utils/routes';

@Component({
  selector: 'app-compare-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './compare-bar.component.html',
  styleUrl: './compare-bar.component.scss'
})
export class CompareBarComponent {

  private readonly language =
    getCurrentLanguage();

  readonly compareUrl =
    appRoutes[this.language].compare;

  /**
   * Lugares vacíos que se muestran como "+"
   * hasta alcanzar el máximo de productos.
   */
  readonly emptySlots = computed(() =>
    Array.from({
      length: Math.max(
        0,
        this.compare.max - this.compare.count()
      )
    })
  );

  constructor(
    public readonly compare: CompareService
  ) {}

  /**
   * Navega a la página de comparación.
   */
  goToCompare(): void {

    if (this.compare.count() < 2) {
      return;
    }

    window.location.href =
      this.compareUrl;
  }

}