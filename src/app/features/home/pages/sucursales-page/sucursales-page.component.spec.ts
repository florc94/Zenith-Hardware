import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router'; // <--- 1. Importar provideRouter
import { SucursalesPageComponent } from './sucursales-page.component';

describe('SucursalesPageComponent', () => {
  let component: SucursalesPageComponent;
  let fixture: ComponentFixture<SucursalesPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SucursalesPageComponent],
      providers: [
        provideRouter([]) // <--- 2. Agregar esto para satisfacer el ActivatedRoute
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SucursalesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});