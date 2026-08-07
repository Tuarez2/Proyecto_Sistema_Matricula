import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LogoComponent } from './logo.component';

describe('LogoComponent', () => {
  let fixture: ComponentFixture<LogoComponent>;
  let componente: LogoComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LogoComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('crea el componente', () => {
    expect(componente).toBeTruthy();
  });

  it('por defecto usa la variante completa', () => {
    expect(componente.variante()).toBe('completo');
  });

  it('la variante completa apunta al logo horizontal', () => {
    expect(componente.obtenerArchivo()).toBe(
      'assets/logo/logo-horizontal.svg',
    );
  });

  it('la variante isotipo apunta al isotipo', () => {
    fixture.componentRef.setInput('variante', 'isotipo');
    fixture.detectChanges();

    expect(componente.obtenerArchivo()).toBe('assets/logo/isotipo.svg');
  });

  it('la variante completa-claro apunta al logo claro', () => {
    fixture.componentRef.setInput('variante', 'completo-claro');
    fixture.detectChanges();

    expect(componente.obtenerArchivo()).toBe(
      'assets/logo/logo-horizontal-claro.svg',
    );
  });

  it('la variante sello apunta al isotipo sello', () => {
    fixture.componentRef.setInput('variante', 'sello');
    fixture.detectChanges();

    expect(componente.obtenerArchivo()).toBe('assets/logo/isotipo-sello.svg');
  });

  it('incluye una etiqueta accesible del sistema', () => {
    expect(componente.obtenerEtiqueta()).toContain('Sistema de Matrícula');
  });

  it('la imagen incluye un atributo alt descriptivo', () => {
    const imagen = fixture.nativeElement.querySelector('img') as HTMLImageElement;

    expect(imagen.getAttribute('alt')).toBe(
      'Sistema de Matrícula Universitaria',
    );
  });

  it('el modo compacto agrega la clase correspondiente', () => {
    fixture.componentRef.setInput('compacto', true);
    fixture.detectChanges();

    const imagen = fixture.nativeElement.querySelector('img') as HTMLImageElement;

    expect(imagen.classList.contains('logo-marca--compacto')).toBe(true);
  });
});
