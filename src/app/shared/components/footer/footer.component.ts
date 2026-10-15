import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import {
  appRoutes,
  getCurrentLanguage
} from '../../../utils/routes';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule
  ],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {

  email: string = '';
  subscribed: boolean = false;
  error: string = '';

  currentYear: number =
    new Date().getFullYear();

  routes = appRoutes;

  language =
    getCurrentLanguage();

  /**
   * Categorías principales de ShopSphere.
   * Deben coincidir con las categorías
   * mostradas en la página de inicio.
   */
  private readonly categoriesData = [
    {
      labelEs: 'Audio',
      labelEn: 'Audio',
      query: 'audio'
    },
    {
      labelEs: 'Computación',
      labelEn: 'Computing',
      query: 'computación'
    },
    {
      labelEs: 'Gaming',
      labelEn: 'Gaming',
      query: 'gaming'
    },
    {
      labelEs: 'Accesorios',
      labelEn: 'Accessories',
      query: 'accesorios'
    }
  ];

  /**
   * Enlaces de ayuda.
   */
  private readonly helpLinksData = [
    {
      labelEs: 'Sucursales',
      labelEn: 'Branches',
      route: 'branches' as const
    },
    {
      labelEs: 'Política de devoluciones',
      labelEn: 'Returns Policy',
      route: 'returns' as const
    },
    {
      labelEs: 'Preguntas frecuentes',
      labelEn: 'Frequently Asked Questions',
      route: 'faq' as const
    },
    {
      labelEs: 'Términos y condiciones',
      labelEn: 'Terms and Conditions',
      route: 'terms' as const
    },
    {
      labelEs: 'Envíos y entregas',
      labelEn: 'Shipping and Delivery',
      route: 'shipping' as const
    }
  ];

  /**
   * Determina si el sitio está en inglés.
   */
  get isEnglish(): boolean {
    return this.language === 'en';
  }

  /**
   * Categorías traducidas según el idioma actual.
   */
  get categories() {
    return this.categoriesData.map(
      category => ({
        label: this.isEnglish
          ? category.labelEn
          : category.labelEs,

        query: category.query
      })
    );
  }

  /**
   * Enlaces de ayuda traducidos
   * y adaptados al idioma actual.
   */
  get helpLinks() {
    return this.helpLinksData.map(
      link => ({
        label: this.isEnglish
          ? link.labelEn
          : link.labelEs,

        href:
          this.routes[
            this.language
          ][link.route]
      })
    );
  }

  /**
   * Determina si el usuario actual
   * tiene permisos de administrador.
   */
  get isAdmin(): boolean {

    const user =
      localStorage.getItem('user') ||
      sessionStorage.getItem('user');

    if (!user) {
      return false;
    }

    try {

      const parsed =
        JSON.parse(user);

      return parsed.role === 'admin';

    } catch (e) {

      return false;

    }
  }

  /**
   * Limpia el mensaje de error
   * cuando el usuario modifica el email.
   */
  onEmailChange(): void {

    if (this.error) {
      this.error = '';
    }

  }

  /**
   * Maneja la suscripción al newsletter.
   */
  handleSubscribe(
    event: Event
  ): void {

    event.preventDefault();

    if (
      !this.email ||
      !this.email.includes('@')
    ) {

      this.error =
        'Por favor ingresá un email válido.';

      return;
    }

    this.subscribed = true;
    this.error = '';

  }
}