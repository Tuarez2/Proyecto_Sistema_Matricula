import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-boton-atras',
  imports: [RouterLink],
  templateUrl: './boton-atras.component.html',
  styleUrl: './boton-atras.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BotonAtrasComponent {
  readonly ruta = input<string>('/');
  readonly etiqueta = input<string>('Volver al inicio');
}
