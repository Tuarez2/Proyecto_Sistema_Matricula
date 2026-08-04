import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Estudiante } from '../../models/estudiante.model';

@Component({
  selector: 'app-estudiante-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="card card-body shadow-sm">
      <div class="row g-3">
        <div class="col-md-6">
          <label class="form-label font-weight-bold">Cédula</label>
          <input type="text" class="form-control" formControlName="cedula" placeholder="Ingrese la cédula">
          <div *ngIf="form.get('cedula')?.touched && form.get('cedula')?.invalid" class="text-danger small mt-1">
            La cédula es requerida.
          </div>
        </div>

        <div class="col-md-6">
          <label class="form-label font-weight-bold">Nombres</label>
          <input type="text" class="form-control" formControlName="nombres" placeholder="Ingrese nombres">
          <div *ngIf="form.get('nombres')?.touched && form.get('nombres')?.invalid" class="text-danger small mt-1">
            Los nombres son requeridos.
          </div>
        </div>

        <div class="col-md-6">
          <label class="form-label font-weight-bold">Apellidos</label>
          <input type="text" class="form-control" formControlName="apellidos" placeholder="Ingrese apellidos">
          <div *ngIf="form.get('apellidos')?.touched && form.get('apellidos')?.invalid" class="text-danger small mt-1">
            Los apellidos son requeridos.
          </div>
        </div>

        <div class="col-md-6">
          <label class="form-label font-weight-bold">Correo Electrónico</label>
          <input type="email" class="form-control" formControlName="email" placeholder="ejemplo@correo.com">
          <div *ngIf="form.get('email')?.touched && form.get('email')?.invalid" class="text-danger small mt-1">
            Ingrese un correo válido.
          </div>
        </div>

        <div class="col-md-6">
          <label class="form-label font-weight-bold">Teléfono</label>
          <input type="text" class="form-control" formControlName="telefono" placeholder="Ingrese teléfono">
        </div>

        <div class="col-md-6">
          <label class="form-label font-weight-bold">Carrera</label>
          <input type="text" class="form-control" formControlName="carrera" placeholder="Ingrese la carrera">
          <div *ngIf="form.get('carrera')?.touched && form.get('carrera')?.invalid" class="text-danger small mt-1">
            La carrera es requerida.
          </div>
        </div>

        <div class="col-md-6">
          <label class="form-label font-weight-bold">Estado</label>
          <select class="form-select" formControlName="estado">
            <option value="ACTIVO">ACTIVO</option>
            <option value="INACTIVO">INACTIVO</option>
          </select>
        </div>
      </div>

      <div class="d-flex justify-content-end gap-2 mt-4">
        <button type="button" class="btn btn-secondary" (click)="onCancel.emit()">
          Cancelar
        </button>
        <button type="submit" class="btn btn-primary" [disabled]="form.invalid">
          {{ isEdit ? 'Actualizar' : 'Guardar' }}
        </button>
      </div>
    </form>
  `
})
export class EstudianteFormComponent implements OnInit {
  @Input() initialData?: Estudiante;
  @Input() isEdit = false;
  @Output() onSave = new EventEmitter<Estudiante>();
  @Output() onCancel = new EventEmitter<void>();

  form!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      cedula: [this.initialData?.cedula || '', [Validators.required]],
      nombres: [this.initialData?.nombres || '', [Validators.required]],
      apellidos: [this.initialData?.apellidos || '', [Validators.required]],
      email: [this.initialData?.email || '', [Validators.required, Validators.email]],
      telefono: [this.initialData?.telefono || ''],
      carrera: [this.initialData?.carrera || '', [Validators.required]],
      estado: [this.initialData?.estado || 'ACTIVO', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.onSave.emit(this.form.value);
    }
  }
}