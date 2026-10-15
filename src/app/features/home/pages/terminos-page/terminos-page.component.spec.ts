import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router'; // <--- 1. Importar provideRouter
import { TerminosPageComponent } from './terminos-page.component';

describe('TerminosPageComponent', () => {
  let component: TerminosPageComponent;
  let fixture: ComponentFixture<TerminosPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TerminosPageComponent],
      providers: [
        provideRouter([]) // <--- 2. Agregar esto para satisfacer el ActivatedRoute
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TerminosPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});