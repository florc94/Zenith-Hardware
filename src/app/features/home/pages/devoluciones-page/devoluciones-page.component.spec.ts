import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router'; // <--- 1. Importar provideRouter
import { DevolucionesPageComponent } from './devoluciones-page.component';

describe('DevolucionesPageComponent', () => {
  let component: DevolucionesPageComponent;
  let fixture: ComponentFixture<DevolucionesPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DevolucionesPageComponent],
      providers: [
        provideRouter([]) // <--- 2. Agregar esto para satisfacer el ActivatedRoute
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DevolucionesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});