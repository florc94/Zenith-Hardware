import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router'; // <--- 1. Importar provideRouter
import { EnviosPageComponent } from './envios-page.component';

describe('EnviosPageComponent', () => {
  let component: EnviosPageComponent;
  let fixture: ComponentFixture<EnviosPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnviosPageComponent],
      providers: [
        provideRouter([]) // <--- 2. Agregar esto para satisfacer el ActivatedRoute
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnviosPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});