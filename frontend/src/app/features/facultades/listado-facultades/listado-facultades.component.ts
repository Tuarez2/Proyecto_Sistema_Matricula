import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import type { Facultad, SolicitudFacultad } from '../models/facultad.model';
import { FacultadesService } from '../services/facultades.service';

@Component({ selector: 'app-listado-facultades', imports: [ReactiveFormsModule], templateUrl: './listado-facultades.component.html', changeDetection: ChangeDetectionStrategy.OnPush })
export class ListadoFacultadesComponent implements OnInit {
  private readonly formulario = inject(FormBuilder); private readonly servicio = inject(FacultadesService); private readonly destruccion = inject(DestroyRef);
  private readonly estadoFacultades = signal<Facultad[]>([]); private readonly estadoCargando = signal(false); private readonly estadoError = signal<string | null>(null); private readonly estadoEdicion = signal<number | null>(null);
  readonly facultades = this.estadoFacultades.asReadonly(); readonly cargando = this.estadoCargando.asReadonly(); readonly mensajeError = this.estadoError.asReadonly(); readonly idEdicion = this.estadoEdicion.asReadonly();
  readonly filtros = this.formulario.nonNullable.group({ codigo: ['', Validators.maxLength(20)], nombre: ['', Validators.maxLength(120)], activo: [''] });
  readonly formularioFacultad = this.formulario.nonNullable.group({ codigo: ['', [Validators.required, Validators.maxLength(20)]], nombre: ['', [Validators.required, Validators.maxLength(120)]] });
  ngOnInit(): void { this.cargarFacultades(); }
  cargarFacultades(): void { if (this.cargando()) return; const valores = this.filtros.getRawValue(); this.estadoCargando.set(true); this.estadoError.set(null); this.servicio.listarFacultades({ codigo: valores.codigo.trim() || undefined, nombre: valores.nombre.trim() || undefined, activo: valores.activo === '' ? undefined : valores.activo === 'true' }).pipe(takeUntilDestroyed(this.destruccion), finalize(() => this.estadoCargando.set(false))).subscribe({ next: r => this.estadoFacultades.set(r.data ?? []), error: e => this.estadoError.set(this.mensaje(e)) }); }
  guardarFacultad(): void { if (this.formularioFacultad.invalid || this.cargando()) { this.formularioFacultad.markAllAsTouched(); return; } const datos = this.formularioFacultad.getRawValue(); const solicitud: SolicitudFacultad = { codigo: datos.codigo.trim().toUpperCase(), nombre: datos.nombre.trim() }; this.estadoCargando.set(true); const id = this.idEdicion(); const operacion = id ? this.servicio.actualizarFacultad(id, solicitud) : this.servicio.crearFacultad(solicitud); operacion.pipe(takeUntilDestroyed(this.destruccion), finalize(() => this.estadoCargando.set(false))).subscribe({ next: () => { this.cancelarEdicion(); this.cargarFacultades(); }, error: e => this.estadoError.set(this.mensaje(e)) }); }
  editarFacultad(facultad: Facultad): void { this.estadoEdicion.set(facultad.id); this.formularioFacultad.setValue({ codigo: facultad.codigo, nombre: facultad.nombre }); }
  cancelarEdicion(): void { this.estadoEdicion.set(null); this.formularioFacultad.reset({ codigo: '', nombre: '' }); }
  cambiarEstado(facultad: Facultad): void { this.estadoCargando.set(true); this.servicio.cambiarEstadoFacultad(facultad.id, !facultad.activo).pipe(takeUntilDestroyed(this.destruccion), finalize(() => this.estadoCargando.set(false))).subscribe({ next: () => this.cargarFacultades(), error: e => this.estadoError.set(this.mensaje(e)) }); }
  private mensaje(error: unknown): string { if (error instanceof HttpErrorResponse && error.status === 409) return error.error?.code === 'FACULTAD_HAS_ACTIVE_CARRERAS' ? 'No puede desactivar una facultad con carreras activas.' : 'El código o nombre de la facultad ya existe.'; return 'No fue posible completar la operación de facultades.'; }
}
