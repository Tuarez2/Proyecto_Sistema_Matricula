import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';

describe('Componente principal', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('crea la aplicacion', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const aplicacion = fixture.componentInstance;
    expect(aplicacion).toBeTruthy();
  });
});
