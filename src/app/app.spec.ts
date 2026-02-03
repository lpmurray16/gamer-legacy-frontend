import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { provideRouter } from '@angular/router';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.logo-text-desktop')?.textContent).toContain('GAMER LEGACY');
    expect(compiled.querySelector('.logo-text-mobile')?.textContent).toContain('GL');
  });

  it('should toggle menu', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    // Accessing signal value
    // @ts-ignore
    expect(app.isMenuOpen()).toBeFalse();
    
    app.toggleMenu();
    // @ts-ignore
    expect(app.isMenuOpen()).toBeTrue();
    
    app.closeMenu();
    // @ts-ignore
    expect(app.isMenuOpen()).toBeFalse();
  });
});
