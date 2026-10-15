import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { AdminProductFormComponent } from './product-form.component';

describe('AdminProductFormComponent', () => {
  let component: AdminProductFormComponent;
  let fixture: ComponentFixture<AdminProductFormComponent>;
  let navigateSpy: jasmine.Spy;

  const API = 'http://localhost:3000/products';

  const validValues = {
    name: 'Zapatillas urbanas',
    category: 'Calzado',
    description: '',
    price: 10,
    stock: 5,
    imageUrl: 'https://img.test/1.jpg',
    images: '',
    shippingInfo: ''
  };

  const apiProduct = {
    id: 7,
    name: 'Remera básica',
    category: 'Indumentaria',
    description: 'Algodón 100%',
    price: 25.5,
    stock: 12,
    imageUrl: 'https://img.test/1.jpg',
    images: ['https://img.test/2.jpg', 'https://img.test/3.jpg'],
    shippingInfo: 'Envío a todo el país'
  };

  // El componente usa fetch directo (no HttpClient), así que se mockea window.fetch.
  // Uso un objeto Response falso con promesas de Zone: res.json() de un Response real
  // se resuelve con tareas nativas del navegador y flushMicrotasks() no las ve.
  function mockFetch(body: unknown = {}, status = 200): jasmine.Spy {
    return spyOn(window, 'fetch').and.callFake(() =>
      Promise.resolve({
        ok: status >= 200 && status < 300,
        status,
        json: () => Promise.resolve(body)
      } as Response)
    );
  }

  // No llamo a detectChanges acá: cada test decide cuándo dispara ngOnInit.
  // Si el test necesita mockear fetch (modo edición), tiene que hacerlo ANTES de detectChanges.
  function setup(id?: string) {
    TestBed.configureTestingModule({
      imports: [AdminProductFormComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } }
        }
      ]
    });

    navigateSpy = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(AdminProductFormComponent);
    component = fixture.componentInstance;
  }

  describe('modo creación', () => {
    beforeEach(() => setup());

    it('arranca sin productId, sin loading y con el título de creación', () => {
      fixture.detectChanges();

      expect(component.productId).toBeNull();
      expect(component.loading()).toBe(false);
      expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Nuevo producto');
    });

    it('no pide nada al backend al iniciar', () => {
      const fetchSpy = mockFetch();
      fixture.detectChanges();

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('el formulario vacío es inválido', () => {
      fixture.detectChanges();

      expect(component.form.invalid).toBe(true);
    });

    it('ofrece las 5 categorías fijas en el select', () => {
      fixture.detectChanges();

      const options: HTMLOptionElement[] = Array.from(
        fixture.nativeElement.querySelectorAll('select option')
      );

      // la primera es el placeholder deshabilitado
      expect(options.slice(1).map((o) => o.textContent?.trim())).toEqual([
        'Indumentaria',
        'Accesorios',
        'Tecnología',
        'Hogar',
        'Calzado'
      ]);
    });
  });

  describe('validaciones', () => {
    beforeEach(() => {
      setup();
      fixture.detectChanges();
    });

    it('un formulario con datos válidos es válido', () => {
      component.form.patchValue(validValues);

      expect(component.form.valid).toBe(true);
    });

    ['name', 'category', 'imageUrl'].forEach((field) => {
      it(`${field} vacío marca error "required"`, () => {
        component.form.patchValue({ ...validValues, [field]: '' });

        expect(component.f[field].errors?.['required']).toBeTruthy();
        expect(component.form.invalid).toBe(true);
      });
    });

    ['description', 'images', 'shippingInfo'].forEach((field) => {
      it(`${field} es opcional`, () => {
        component.form.patchValue({ ...validValues, [field]: '' });

        expect(component.f[field].valid).toBe(true);
      });
    });

    it('precio negativo marca error "min"', () => {
      component.form.patchValue({ ...validValues, price: -5 });

      expect(component.f['price'].errors?.['min']).toBeTruthy();
      expect(component.form.invalid).toBe(true);
    });

    it('precio vacío (null) marca error "required"', () => {
      component.form.patchValue({ ...validValues, price: null });

      expect(component.f['price'].errors?.['required']).toBeTruthy();
    });

    it('stock negativo marca error "min"', () => {
      component.form.patchValue({ ...validValues, stock: -1 });

      expect(component.f['stock'].errors?.['min']).toBeTruthy();
    });

    it('stock vacío (null) marca error "required"', () => {
      component.form.patchValue({ ...validValues, stock: null });

      expect(component.f['stock'].errors?.['required']).toBeTruthy();
    });

    // --- Brechas: documentan lo que el form ACEPTA hoy. Si las corregís, invertí estos tests. ---
    describe('brechas actuales (comportamiento permisivo)', () => {
      it('acepta stock decimal (1.5): solo valida min(0), no que sea entero', () => {
        component.form.patchValue({ ...validValues, stock: 1.5 });

        expect(component.f['stock'].valid).toBe(true);
      });

      it('acepta precio 0', () => {
        component.form.patchValue({ ...validValues, price: 0 });

        expect(component.f['price'].valid).toBe(true);
      });

      it('acepta un nombre con solo espacios', () => {
        component.form.patchValue({ ...validValues, name: '   ' });

        expect(component.f['name'].valid).toBe(true);
      });

      it('acepta una imageUrl que no es una URL', () => {
        component.form.patchValue({ ...validValues, imageUrl: 'no-es-una-url' });

        expect(component.f['imageUrl'].valid).toBe(true);
      });
    });
  });

  describe('zodError (mensajes de error)', () => {
    beforeEach(() => {
      setup();
      fixture.detectChanges();
    });

    it('devuelve null si el control no fue tocado, aunque sea inválido', () => {
      expect(component.zodError(component.f['name'])).toBeNull();
    });

    it('devuelve el mensaje de obligatorio si está tocado y vacío', () => {
      component.f['name'].markAsTouched();

      expect(component.zodError(component.f['name'])).toBe('Este campo es obligatorio.');
    });

    it('devuelve el mensaje de valor negativo para price con min', () => {
      component.f['price'].setValue(-1);
      component.f['price'].markAsTouched();

      expect(component.zodError(component.f['price'])).toBe('El valor no puede ser negativo.');
    });

    it('devuelve null si el control es válido', () => {
      component.f['name'].setValue('Algo');
      component.f['name'].markAsTouched();

      expect(component.zodError(component.f['name'])).toBeNull();
    });
  });

  describe('mensajes en el template', () => {
    beforeEach(() => {
      setup();
      fixture.detectChanges();
    });

    it('no muestra errores antes de interactuar', () => {
      expect(fixture.nativeElement.querySelectorAll('.field-error').length).toBe(0);
    });

    it('al enviar vacío muestra "obligatorio" en nombre, categoría e imagen principal', () => {
      fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
      fixture.detectChanges();

      const errors: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.field-error'));

      // price y stock arrancan en 0 (válidos); description no tiene validadores
      expect(errors.length).toBe(3);
      errors.forEach((e) => expect(e.textContent?.trim()).toBe('Este campo es obligatorio.'));
    });

    it('muestra el error de valor negativo debajo del precio', () => {
      component.f['price'].setValue(-5);
      component.f['price'].markAsTouched();
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('El valor no puede ser negativo.');
    });
  });

  describe('submit', () => {
    beforeEach(() => setup());

    it('con el form inválido no llama al backend y marca todo como tocado', () => {
      const fetchSpy = mockFetch();
      fixture.detectChanges();

      component.submit();

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(component.f['name'].touched).toBe(true);
      expect(component.submitting()).toBe(false);
    });

    it('crea el producto con POST y navega al listado', fakeAsync(() => {
      const fetchSpy = mockFetch({ id: 1 });
      fixture.detectChanges();
      component.form.patchValue(validValues);

      component.submit();
      flushMicrotasks();

      const [url, options] = fetchSpy.calls.mostRecent().args as [string, RequestInit];
      expect(url).toBe(API);
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body as string)).toEqual({ ...validValues, images: [] });
      expect(navigateSpy).toHaveBeenCalledWith(['/admin/products']);
    }));

    it('convierte las imágenes separadas por coma en array, recortando y descartando vacías', fakeAsync(() => {
      const fetchSpy = mockFetch();
      fixture.detectChanges();
      component.form.patchValue({ ...validValues, images: 'a.jpg,  b.jpg ,, c.jpg ,' });

      component.submit();
      flushMicrotasks();

      const options = fetchSpy.calls.mostRecent().args[1] as RequestInit;
      expect(JSON.parse(options.body as string).images).toEqual(['a.jpg', 'b.jpg', 'c.jpg']);
    }));

    it('BRECHA: el placeholder promete saltos de línea, pero solo separa por coma', fakeAsync(() => {
      const fetchSpy = mockFetch();
      fixture.detectChanges();
      component.form.patchValue({ ...validValues, images: 'a.jpg\nb.jpg' });

      component.submit();
      flushMicrotasks();

      const options = fetchSpy.calls.mostRecent().args[1] as RequestInit;
      expect(JSON.parse(options.body as string).images).toEqual(['a.jpg\nb.jpg']);
    }));

    it('mientras guarda, deshabilita el botón y muestra "Guardando…"', fakeAsync(() => {
      spyOn(window, 'fetch').and.returnValue(new Promise<Response>(() => {})); // nunca responde
      fixture.detectChanges();
      component.form.patchValue(validValues);

      component.submit();
      fixture.detectChanges();

      const button: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(component.submitting()).toBe(true);
      expect(button.disabled).toBe(true);
      expect(button.textContent).toContain('Guardando…');
    }));

    it('si el backend responde error, no navega y reactiva el botón', fakeAsync(() => {
      mockFetch({ error: 'boom' }, 500);
      fixture.detectChanges();
      component.form.patchValue(validValues);

      component.submit();
      flushMicrotasks();

      expect(navigateSpy).not.toHaveBeenCalled();
      expect(component.submitting()).toBe(false);
    }));
  });

  describe('modo edición', () => {
    beforeEach(() => setup('7'));

    it('lee el id de la ruta y pide el producto al backend', fakeAsync(() => {
      const fetchSpy = mockFetch(apiProduct);

      fixture.detectChanges();
      flushMicrotasks();

      expect(component.productId).toBe(7);
      expect(fetchSpy).toHaveBeenCalledWith(`${API}/7`);
    }));

    it('muestra "Cargando…" hasta que llega el producto', fakeAsync(() => {
      mockFetch(apiProduct);

      fixture.detectChanges();
      expect(component.loading()).toBe(true);
      expect(fixture.nativeElement.textContent).toContain('Cargando…');

      flushMicrotasks();
      fixture.detectChanges();
      expect(component.loading()).toBe(false);
      expect(fixture.nativeElement.querySelector('form')).not.toBeNull();
    }));

    it('carga los datos en el form y convierte el array de imágenes en texto separado por comas', fakeAsync(() => {
      mockFetch(apiProduct);

      fixture.detectChanges();
      flushMicrotasks();

      expect(component.form.value).toEqual({
        name: 'Remera básica',
        category: 'Indumentaria',
        description: 'Algodón 100%',
        price: 25.5,
        stock: 12,
        imageUrl: 'https://img.test/1.jpg',
        images: 'https://img.test/2.jpg, https://img.test/3.jpg',
        shippingInfo: 'Envío a todo el país'
      });
    }));

    it('usa el título de edición', fakeAsync(() => {
      mockFetch(apiProduct);

      fixture.detectChanges();
      flushMicrotasks();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Editar producto');
    }));

    it('si falla la carga, apaga el loading y deja el form vacío', fakeAsync(() => {
      mockFetch({}, 404);

      fixture.detectChanges();
      flushMicrotasks();

      expect(component.loading()).toBe(false);
      expect(component.f['name'].value).toBe('');
    }));

    it('al guardar usa PUT sobre /products/:id y navega al listado', fakeAsync(() => {
      const fetchSpy = mockFetch(apiProduct);
      fixture.detectChanges();
      flushMicrotasks();

      component.submit();
      flushMicrotasks();

      const [url, options] = fetchSpy.calls.mostRecent().args as [string, RequestInit];
      expect(url).toBe(`${API}/7`);
      expect(options.method).toBe('PUT');
      expect(JSON.parse(options.body as string).images).toEqual([
        'https://img.test/2.jpg',
        'https://img.test/3.jpg'
      ]);
      expect(navigateSpy).toHaveBeenCalledWith(['/admin/products']);
    }));
  });
});