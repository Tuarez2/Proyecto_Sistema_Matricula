import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { Docente, FiltrosDocente } from '../models/docente.model';

@Injectable({
  providedIn: 'root'
})
export class DocentesService {
  private mockDocentes: Docente[] = [
    { id: 1, cedula: '1308765432', nombres: 'Roberto', apellidos: 'Vera', email: 'rvera@universidad.edu.ec', telefono: '0981234567', titulo: 'Mgtr. en Sistemas', especialidad: 'Desarrollo Web', estado: 'ACTIVO' },
    { id: 2, cedula: '1301122334', nombres: 'María', apellidos: 'Zambrano', email: 'mzambrano@universidad.edu.ec', telefono: '0991122334', titulo: 'Ph.D. en Ciencias Computacionales', especialidad: 'Inteligencia Artificial', estado: 'ACTIVO' }
  ];

  private docentes$ = new BehaviorSubject<Docente[]>(this.mockDocentes);

  getDocentes(filtros?: FiltrosDocente): Observable<Docente[]> {
    let resultado = [...this.mockDocentes];

    if (filtros) {
      if (filtros.busqueda) {
        const busqueda = filtros.busqueda.toLowerCase();
        resultado = resultado.filter(d => 
          d.nombres.toLowerCase().includes(busqueda) ||
          d.apellidos.toLowerCase().includes(busqueda) ||
          d.cedula.includes(busqueda)
        );
      }
      if (filtros.especialidad) {
        resultado = resultado.filter(d => d.especialidad === filtros.especialidad);
      }
      if (filtros.estado) {
        resultado = resultado.filter(d => d.estado === filtros.estado);
      }
    }

    return of(resultado);
  }

  getDocenteById(id: number): Observable<Docente | undefined> {
    return of(this.mockDocentes.find(d => d.id === id));
  }

  crearDocente(docente: Docente): Observable<Docente> {
    const nuevo = { ...docente, id: this.mockDocentes.length + 1 };
    this.mockDocentes.push(nuevo);
    this.docentes$.next(this.mockDocentes);
    return of(nuevo);
  }

  actualizarDocente(id: number, docente: Docente): Observable<Docente> {
    const index = this.mockDocentes.findIndex(d => d.id === id);
    if (index !== -1) {
      this.mockDocentes[index] = { ...docente, id };
      this.docentes$.next(this.mockDocentes);
    }
    return of(this.mockDocentes[index]);
  }

  eliminarDocente(id: number): Observable<boolean> {
    this.mockDocentes = this.mockDocentes.filter(d => d.id !== id);
    this.docentes$.next(this.mockDocentes);
    return of(true);
  }
}