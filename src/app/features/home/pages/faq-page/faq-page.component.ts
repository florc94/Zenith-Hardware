import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface FaqItem {
  q: string;
  a: string;
}

@Component({
  selector: 'app-faq-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './faq-page.component.html',
  styleUrl: './faq-page.component.scss'
})
export class FaqPageComponent {
  searchQuery = '';
  openIndex = signal<number | null>(0); // Primera pregunta abierta por defecto

  faqs: FaqItem[] = [
    {
      q: '¿Cuánto demora el envío de los productos?',
      a: 'La mayoría de los pedidos llegan dentro de los 3 a 5 días hábiles. Podés verificar el tiempo estimado de entrega para cualquier producto en su respectiva página de detalle.'
    },
    {
      q: '¿Ofrecen envío gratuito?',
      a: 'Sí, las compras superiores a $50.000 (o monto mínimo vigente) tienen envío gratis. Los pedidos por debajo de esa cifra tienen una tarifa fija de envío.'
    },
    {
      q: '¿Puedo modificar o cancelar mi pedido después de realizarlo?',
      a: 'Los pedidos se procesan rápidamente, por lo que no podemos garantizar modificaciones una vez confirmados. Escribinos de inmediato y haremos nuestro mejor esfuerzo para ayudarte.'
    },
    {
      q: '¿Cuál es la política de devoluciones?',
      a: 'Aceptamos devoluciones dentro de los 30 días posteriores a la entrega, siempre y cuando los artículos estén sin usar y en su empaque original.'
    },
    {
      q: '¿Realizan envíos internacionales?',
      a: 'Por el momento realizamos envíos únicamente dentro del país. Suscribite a nuestro newsletter para enterarte cuando nos expandamos.'
    },
    {
      q: '¿Cómo puedo hacer el seguimiento de mi pedido?',
      a: 'Una vez que tu pedido sea despachado, recibirás una confirmación con los detalles de seguimiento. También podés consultar el estado de tus compras en la sección "Mis pedidos".'
    }
  ];

  // Filtro reactivo en tiempo real basado en lo que escribe el usuario
  filteredFaqs = computed(() => {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) return this.faqs;
    
    return this.faqs.filter(
      item => item.q.toLowerCase().includes(query) || item.a.toLowerCase().includes(query)
    );
  });

  onSearchChange(): void {
    this.openIndex.set(null); // Cierra los acordeones al buscar para mayor prolijidad
  }

  toggleAccordion(index: number): void {
    const current = this.openIndex();
    this.openIndex.set(current === index ? null : index);
  }
}