import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  inject,
} from '@angular/core';

import {
  Densidad,
  PreferenciasService,
  TamanoTexto,
  TemaPreferido,
} from '../../../core/services/preferencias.service';

interface OpcionSegmentada<T extends string> {
  valor: T;
  etiqueta: string;
}

@Component({
  selector: 'app-preferencias-panel',
  imports: [],
  templateUrl: './preferencias-panel.component.html',
  styleUrl: './preferencias-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreferenciasPanelComponent {
  private readonly preferenciasService = inject(PreferenciasService);

  @Output() cerrado = new EventEmitter<void>();

  readonly temaPreferido = this.preferenciasService.temaPreferido;
  readonly tamanoTexto = this.preferenciasService.tamanoTexto;
  readonly densidad = this.preferenciasService.densidad;
  readonly contrasteReforzado = this.preferenciasService.contrasteReforzado;
  readonly focoReforzado = this.preferenciasService.focoReforzado;
  readonly movimientoReducido = this.preferenciasService.movimientoReducido;

  readonly opcionesTema: OpcionSegmentada<TemaPreferido>[] = [
    { valor: 'claro', etiqueta: 'Claro' },
    { valor: 'oscuro', etiqueta: 'Oscuro' },
    { valor: 'sistema', etiqueta: 'Sistema' },
  ];

  readonly opcionesTamano: OpcionSegmentada<TamanoTexto>[] = [
    { valor: 'normal', etiqueta: 'Normal' },
    { valor: 'grande', etiqueta: 'Ampliado' },
  ];

  readonly opcionesDensidad: OpcionSegmentada<Densidad>[] = [
    { valor: 'comoda', etiqueta: 'Cómoda' },
    { valor: 'compacta', etiqueta: 'Compacta' },
  ];

  seleccionarTema(tema: TemaPreferido): void {
    this.preferenciasService.establecerTema(tema);
  }

  seleccionarTamano(tamano: TamanoTexto): void {
    this.preferenciasService.establecerTamanoTexto(tamano);
  }

  seleccionarDensidad(densidad: Densidad): void {
    this.preferenciasService.establecerDensidad(densidad);
  }

  alternarContraste(): void {
    this.preferenciasService.establecerContrasteReforzado(
      !this.contrasteReforzado(),
    );
  }

  alternarFoco(): void {
    this.preferenciasService.establecerFocoReforzado(!this.focoReforzado());
  }

  alternarMovimientoReducido(): void {
    this.preferenciasService.establecerMovimientoReducido(
      !this.movimientoReducido(),
    );
  }

  restablecerPreferencias(): void {
    this.preferenciasService.restablecerTodo();
  }
}
