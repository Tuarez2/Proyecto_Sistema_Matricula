import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { obtenerUrlApi } from '../../../core/config/configuracion-api';
import type { RespuestaRoles } from '../models/rol.model';

@Injectable({
  providedIn: 'root',
})
export class RolesService {
  private readonly http = inject(HttpClient);

  listarRoles(): Observable<RespuestaRoles> {
    return this.http.get<RespuestaRoles>(obtenerUrlApi('roles'));
  }
}
