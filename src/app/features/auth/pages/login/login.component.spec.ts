import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let notifySpy: jasmine.SpyObj<NotificationService>;
  let navigateSpy: jasmine.Spy;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    notifySpy = jasmine.createSpyObj('NotificationService', ['success']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: NotificationService, useValue: notifySpy },
        // Router real (sin rutas reales cargadas) para que RouterLink en el
        // template funcione sin necesidad de mockear sus métodos internos.
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;

    const router = TestBed.inject(Router);
    navigateSpy = spyOn(router, 'navigate');

    fixture.detectChanges();
  });

  it('se crea con los valores precargados del form', () => {
    expect(component).toBeTruthy();
    expect(component.form.value.email).toBe('admin@shopsphere.com');
  });

  it('no llama a auth.login si el form es inválido y marca los controles como touched', () => {
    component.form.setValue({ email: 'no-es-un-email', password: '123' });

    component.submit();

    expect(authServiceSpy.login).not.toHaveBeenCalled();
    expect(component.f['email'].touched).toBe(true);
    expect(component.f['password'].touched).toBe(true);
  });

  it('login exitoso con el admin redirige a /admin/orders y notifica', () => {
    authServiceSpy.login.and.returnValue(of({ token: 'abc' } as any));
    component.form.setValue({ email: 'admin@shopsphere.com', password: 'admin123' });

    component.submit();

    expect(authServiceSpy.login).toHaveBeenCalledWith({
      email: 'admin@shopsphere.com',
      password: 'admin123'
    });
    expect(notifySpy.success).toHaveBeenCalledWith('¡Bienvenido de nuevo!');
    expect(navigateSpy).toHaveBeenCalledWith(['/admin/orders']);
  });

  it('login exitoso con otro email redirige a /catalogo', () => {
    authServiceSpy.login.and.returnValue(of({ token: 'abc' } as any));
    component.form.setValue({ email: 'cliente@mail.com', password: '1234' });

    component.submit();

    expect(navigateSpy).toHaveBeenCalledWith(['/catalogo']);
  });

  it('reconoce al admin sin importar las mayúsculas en el email', () => {
    authServiceSpy.login.and.returnValue(of({ token: 'abc' } as any));
    component.form.setValue({ email: 'ADMIN@SHOPSPHERE.COM', password: 'admin123' });

    component.submit();

    expect(navigateSpy).toHaveBeenCalledWith(['/admin/orders']);
  });

  it('no permite enviar un email con espacios alrededor (lo frena el validador)', () => {
    component.form.setValue({ email: ' admin@shopsphere.com ', password: 'admin123' });

    component.submit();

    expect(authServiceSpy.login).not.toHaveBeenCalled();
  });

  it('pone submitting en true mientras se procesa el login', () => {
    authServiceSpy.login.and.returnValue(of({ token: 'abc' } as any));
    component.form.setValue({ email: 'cliente@mail.com', password: '1234' });

    expect(component.submitting).toBe(false);
    component.submit();

    // El observable mockeado con `of` resuelve sincrónicamente, así que acá
    // ya pasó por next(): submitting no se resetea en el caso exitoso
    // porque el componente navega afuera de la página.
    expect(component.submitting).toBe(true);
  });

  it('si auth.login falla, apaga submitting y no navega', () => {
    authServiceSpy.login.and.returnValue(throwError(() => new Error('credenciales inválidas')));
    component.form.setValue({ email: 'cliente@mail.com', password: '1234' });

    component.submit();

    expect(component.submitting).toBe(false);
    expect(navigateSpy).not.toHaveBeenCalled();
    expect(notifySpy.success).not.toHaveBeenCalled();
  });
});