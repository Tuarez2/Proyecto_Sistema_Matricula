import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { BotonAtrasComponent } from './boton-atras.component';

describe('BotonAtrasComponent', () => {
  let fixture: ComponentFixture<BotonAtrasComponent>;
  let componente: BotonAtrasComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BotonAtrasComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(BotonAtrasComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('crea el componente', () => {
    expect(componente).toBeTruthy();
  });

  it('es un enlace de tipo prev', () => {
    expect(obtenerEnlace()?.getAttribute('rel')).toBe('prev');
  });

  it('apunta a la raiz por defecto', () => {
    expect(obtenerEnlace()?.getAttribute('href')).toBe('/');
  });

  it('apunta a la ruta configurada', () => {
    fixture.componentRef.setInput('ruta', '/estudiantes');
    fixture.detectChanges();

    expect(obtenerEnlace()?.getAttribute('href')).toBe('/estudiantes');
  });

  it('muestra la etiqueta por defecto', () => {
    expect(obtenerEnlace()?.textContent).toContain('Volver al inicio');
  });

  it('muestra la etiqueta configurada', () => {
    fixture.componentRef.setInput('etiqueta', 'Volver a estudiantes');
    fixture.detectChanges();

    expect(obtenerEnlace()?.textContent).toContain('Volver a estudiantes');
  });

  it('incluye un aria-label accesible', () => {
    expect(obtenerEnlace()?.getAttribute('aria-label')).toContain('Volver al inicio');
  });

  function obtenerEnlace(): HTMLAnchorElement | null {
    return fixture.nativeElement.querySelector('a') as HTMLAnchorElement | null;
  }
});
