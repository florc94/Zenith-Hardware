import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, Subject, of, throwError } from 'rxjs';
import { AdminDashboardComponent } from './dashboard.component';
import { DashboardMetrics, MetricsService } from '../../services/metrics.service';

describe('AdminDashboardComponent', () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;
  let metricsServiceSpy: jasmine.SpyObj<MetricsService>;

  const mockMetrics: DashboardMetrics = {
    totalOrders: 20,
    totalRevenue: 2500.5,
    thisMonthRevenue: 800,
    avgOrderValue: 125,
    avgDeliveryTimeHours: 72,
    ordersByStatus: {
      paid: 5,
      processing: 3,
      shipped: 2,
      delivered: 10,
      cancelled: 0
    },
    topProducts: [
      { productId: 1, name: 'Zapatillas urbanas', quantity: 8, revenue: 400 },
      { productId: 2, name: 'Remera básica', quantity: 5, revenue: 100 }
    ]
  };

  // Helper: cada test decide qué responde MetricsService.get() (éxito, error o "nunca responde").
  // No llamo a detectChanges acá para poder inspeccionar el estado antes de ngOnInit.
  function setup(response$: Observable<DashboardMetrics>) {
    metricsServiceSpy = jasmine.createSpyObj('MetricsService', ['get']);
    metricsServiceSpy.get.and.returnValue(response$);

    TestBed.configureTestingModule({
      imports: [AdminDashboardComponent],
      providers: [{ provide: MetricsService, useValue: metricsServiceSpy }]
    });

    fixture = TestBed.createComponent(AdminDashboardComponent);
    component = fixture.componentInstance;
  }

  describe('carga de métricas', () => {
    it('empieza en loading y sin métricas antes de ngOnInit', () => {
      setup(of(mockMetrics));

      expect(component.loading()).toBe(true);
      expect(component.metrics()).toBeNull();
    });

    it('carga las métricas y apaga el loading', () => {
      setup(of(mockMetrics));
      fixture.detectChanges(); // dispara ngOnInit

      expect(metricsServiceSpy.get).toHaveBeenCalled();
      expect(component.metrics()).toEqual(mockMetrics);
      expect(component.loading()).toBe(false);
    });

    it('si el servicio falla, apaga el loading y deja metrics en null', () => {
      setup(throwError(() => new Error('500')));
      fixture.detectChanges();

      expect(component.metrics()).toBeNull();
      expect(component.loading()).toBe(false);
    });
  });

  describe('maxStatusCount', () => {
    it('vale 1 mientras no hay métricas (evita dividir por cero en el template)', () => {
      setup(of(mockMetrics));

      expect(component.maxStatusCount()).toBe(1);
    });

    it('devuelve el mayor conteo entre los estados', () => {
      setup(of(mockMetrics));
      fixture.detectChanges();

      expect(component.maxStatusCount()).toBe(10); // delivered
    });

    it('vale 1 si todos los estados están en 0', () => {
      setup(
        of({
          ...mockMetrics,
          ordersByStatus: { paid: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 }
        })
      );
      fixture.detectChanges();

      expect(component.maxStatusCount()).toBe(1);
    });
  });

  describe('formatDeliveryTime', () => {
    beforeEach(() => setup(of(mockMetrics)));

    const cases: { hours: number; expected: string }[] = [
      { hours: 0, expected: '0.0 h' },
      { hours: 6.5, expected: '6.5 h' },
      { hours: 23.9, expected: '23.9 h' },
      { hours: 24, expected: '1.0 días' }, // el límite ya pasa a días
      { hours: 72, expected: '3.0 días' },
      { hours: 55, expected: '2.3 días' }
    ];

    cases.forEach(({ hours, expected }) => {
      it(`${hours} horas se muestra como "${expected}"`, () => {
        expect(component.formatDeliveryTime(hours)).toBe(expected);
      });
    });
  });

  describe('template', () => {
    it('muestra el mensaje de carga mientras la petición no responde', () => {
      setup(new Subject<DashboardMetrics>().asObservable()); // nunca emite
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Calculando métricas');
    });

    it('muestra el mensaje de error si falló la carga', () => {
      setup(throwError(() => new Error('500')));
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('No se pudieron cargar las métricas');
    });

    it('renderiza las 5 tarjetas de métricas con los valores formateados', () => {
      setup(of(mockMetrics));
      fixture.detectChanges();

      const cards = fixture.nativeElement.querySelectorAll('.metric-card');
      const text = fixture.nativeElement.textContent;

      expect(cards.length).toBe(5);
      expect(text).toContain('$2,500.50');
      expect(text).toContain('3.0 días');
    });

    it('dibuja las barras de estado en el orden fijo del fulfillment, con ancho proporcional', () => {
      setup(of(mockMetrics));
      fixture.detectChanges();

      const fills: HTMLElement[] = Array.from(
        fixture.nativeElement.querySelectorAll('.status-bars__fill')
      );

      expect(fills.map((f) => f.getAttribute('data-status'))).toEqual([
        'paid',
        'processing',
        'shipped',
        'delivered',
        'cancelled'
      ]);

      // maxStatusCount = 10 → paid 5/10 = 50%, processing 30%, shipped 20%, delivered 100%, cancelled 0%
      const widths = fills.map((f) => parseFloat(f.style.width));
      expect(widths[0]).toBeCloseTo(50);
      expect(widths[1]).toBeCloseTo(30);
      expect(widths[2]).toBeCloseTo(20);
      expect(widths[3]).toBeCloseTo(100);
      expect(widths[4]).toBeCloseTo(0);
    });

    it('lista los productos más vendidos con su posición', () => {
      setup(of(mockMetrics));
      fixture.detectChanges();

      const rows = fixture.nativeElement.querySelectorAll('.top-products__row');

      expect(rows.length).toBe(2);
      expect(rows[0].textContent).toContain('1');
      expect(rows[0].textContent).toContain('Zapatillas urbanas');
      expect(rows[1].textContent).toContain('Remera básica');
    });

    it('muestra el mensaje vacío si no hay productos vendidos', () => {
      setup(of({ ...mockMetrics, topProducts: [] }));
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelectorAll('.top-products__row').length).toBe(0);
      expect(fixture.nativeElement.textContent).toContain('Todavía no hay ventas suficientes');
    });
  });
});