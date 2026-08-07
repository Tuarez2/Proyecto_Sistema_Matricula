import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type VarianteLogo = 'isotipo' | 'completo' | 'completo-claro' | 'sello';

@Component({
  selector: 'app-logo',
  imports: [],
  templateUrl: './logo.component.html',
  styleUrl: './logo.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoComponent {
  readonly variante = input<VarianteLogo>('completo');
  readonly compacto = input<boolean>(false);

  obtenerArchivo(): string {
    switch (this.variante()) {
      case 'completo':
        return 'assets/logo/logo-horizontal.svg';
      case 'completo-claro':
        return 'assets/logo/logo-horizontal-claro.svg';
      case 'sello':
        return 'assets/logo/isotipo-sello.svg';
      case 'isotipo':
      default:
        return 'assets/logo/isotipo.svg';
    }
  }

  obtenerEtiqueta(): string {
    return 'Sistema de Matrícula Universitaria';
  }
}
