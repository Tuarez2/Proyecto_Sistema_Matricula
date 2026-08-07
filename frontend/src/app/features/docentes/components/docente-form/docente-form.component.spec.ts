import { ComponentFixture, TestBed } from '@angular/core/testing';

import type {
  Docente,
  SolicitudCrearDocente,
} from '../../models/docente.model';
import { DocenteFormComponent } from './docente-form.component';

describe('DocenteFormComponent', () => {
  let fixture: ComponentFixture<DocenteFormComponent>;
  let componente: DocenteFormComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocenteFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DocenteFormComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('no emite cuando el formulario es invalido', () => {
    const guardar = vi.spyOn(componente.guardarDocente, 'emit');

    componente.enviarFormulario();

    expect(guardar).not.toHaveBeenCalled();
    expect(componente.formularioDocente.touched).toBe(true);
  });

  it('emite el payload real del backend cuando el formulario es valido', () => {
    const guardar = vi.spyOn(componente.guardarDocente, 'emit');

    completarFormularioValido();
    componente.enviarFormulario();

    expect(guardar).toHaveBeenCalledWith(crearSolicitudFormulario());
  });

  it('convierte telefono vacio a null', () => {
    const guardar = vi.spyOn(componente.guardarDocente, 'emit');

    completarFormularioValido({ telefono: '' });
    componente.enviarFormulario();

    expect(guardar).toHaveBeenCalledWith(
      expect.objectContaining({ telefono: null }),
    );
  });

  it('puebla el formulario con el docente inicial', () => {
    componente.docenteInicial = crearDocente();
    componente.ngOnChanges({
      docenteInicial: {
        currentValue: componente.docenteInicial,
        previousValue: null,
        firstChange: false,
        isFirstChange: () => false,
      },
    });

    expect(componente.formularioDocente.controls.identificacion.value).toBe(
      '1002003004',
    );
    expect(componente.formularioDocente.controls.activo.value).toBe(true);
  });

  it('no emite dos veces si esta enviando', () => {
    const guardar = vi.spyOn(componente.guardarDocente, 'emit');

    completarFormularioValido();
    componente.enviando = true;
    componente.enviarFormulario();

    expect(guardar).not.toHaveBeenCalled();
  });

  it('emite cancelar solo cuando no esta enviando', () => {
    const cancelar = vi.spyOn(componente.cancelarFormulario, 'emit');

    componente.cancelar();
    componente.enviando = true;
    componente.cancelar();

    expect(cancelar).toHaveBeenCalledTimes(1);
  });

  function completarFormularioValido(
    cambios: Partial<SolicitudFormulario> = {},
  ): void {
    componente.formularioDocente.setValue({
      identificacion: ' 1002003004 ',
      nombres: ' Ana ',
      apellidos: ' Vera ',
      correo: 'ana.vera@universidad.edu',
      telefono: '0999999999',
      especialidad: ' Matemática ',
      activo: true,
      ...cambios,
    });
  }
});

interface SolicitudFormulario {
  identificacion: string;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string;
  especialidad: string;
  activo: boolean;
}

function crearDocente(): Docente {
  return {
    id: 15,
    identificacion: '1002003004',
    nombres: 'Ana',
    apellidos: 'Vera',
    correo: 'ana.vera@universidad.edu',
    telefono: '0999999999',
    especialidad: 'Matemática',
    activo: true,
  };
}

function crearSolicitudFormulario(): SolicitudCrearDocente {
  return {
    identificacion: '1002003004',
    nombres: 'Ana',
    apellidos: 'Vera',
    correo: 'ana.vera@universidad.edu',
    telefono: '0999999999',
    especialidad: 'Matemática',
    activo: true,
  };
}
