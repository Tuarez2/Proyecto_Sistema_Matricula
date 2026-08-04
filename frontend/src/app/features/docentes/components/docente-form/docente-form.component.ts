import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Docente } from '../../models/docente.model';

@Component({
  selector: 'app-docente-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="card shadow-sm p-4">
      <div class="row g-3">
        <div class="col-md-6">
          <label class="form-label font-semibold">Cédula</label>
          <input type="text" class="form-control" formControlName="cedula" placeholder="130XXXXXXX">
        </div>

        <div class="col-md-6">
          <label class="form-label font-semibold">Título</label>
          <input type="text" class="form-control" formControlName="titulo" placeholder="ej. Mgtr. en Sistemas">
        </div>

        <div class="col-md-6">
          <label class="form-label font-semibold">Nombres</label>
          <input type="text" class="form-control" formControlName="nombres">
        </div>

        <div class="col-md-6">
          <label class="form-label font-semibold">Apellidos</label>
          <input type="text" class="form-control" formControlName="apellidos">
        </div>

        <div class="col-md-6">
          <label class="form-label font-semibold">Correo Electrónico</label>
          <input type="email" class="form-control" formControlName="email">
        </div>

        <div class="col-md-6">
          <label class="form-label font-semibold">Teléfono</label>
          <input type="text" class="form-control" formControlName="telefono">
        </div>

        <div class="col-md-6">
          <label class="form-label font-semibold">Especialidad</label>
          <input type="text" class="form-control" formControlName="especialidad">
        </div>

        <div class="col-md-6">
          <label class="form-label font-semibold">Estado</label>
          <select class="form-select" formControlName="estado">
            <option value="ACTIVO">ACTIVO</option>
            <option value="INACTIVO">INACTIVO</option>
          </select>
        </div>

        <div class="col-12 d-flex justify-content-end gap-2 mt-4">
          <button type="button" class="btn btn-secondary" (click)="onCancel.emit()">Cancelar</button>
          <button type="submit" class="btn btn-success" [disabled]="form.invalid">
            {{ isEdit ? 'Actualizar' : 'Guardar' }} Docente
          </button>
        </div>
      </div>
    </form>
  `
})
export class DocenteFormComponent implements OnInit {
  @Input() initialData?: Docente;
  @Input() isEdit: boolean = false;
  @Output() onSave = new EventEmitter<Docente>();
  @Output() onCancel = new EventEmitter<void>();

  form!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      cedula: [this.initialData?.cedula || '', [Validators.required]],
      nombres: [this.initialData?.nombres || '', [Validators.required]],
      apellidos: [this.initialData?.apellidos || '', [Validators.required]],
      email: [this.initialData?.email || '', [Validators.required, Validators.email]],
      telefono: [this.initialData?.telefono || '', [Validators.required]],
      titulo: [this.initialData?.titulo || '', [Validators.required]],
      especialidad: [this.initialData?.especialidad || '', [Validators.required]],
      estado: [this.initialData?.estado || 'ACTIVO', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.onSave.emit(this.form.value);
    }
  }
}
