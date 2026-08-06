import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-boton-atras',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './boton-atras.component.html',
  styleUrl: './boton-atras.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BotonAtrasComponent {}