import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  private readonly router = inject(Router);

  readonly title = signal('Dashboard');
  readonly subtitle = signal('');
  readonly isDark = signal(localStorage.getItem('briefly-theme') === 'dark');

  constructor() {
    this.applyTheme(this.isDark());
    const read = () => {
      let route = this.router.routerState.snapshot.root;
      while (route.firstChild) route = route.firstChild;
      this.title.set(route.data['title'] ?? 'Briefly + Bifrost');
      this.subtitle.set(route.data['subtitle'] ?? '');
    };
    read();
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(read);
  }

  toggleTheme(): void {
    const dark = !this.isDark();
    this.isDark.set(dark);
    localStorage.setItem('briefly-theme', dark ? 'dark' : 'light');
    this.applyTheme(dark);
  }

  private applyTheme(dark: boolean): void {
    document.documentElement.dataset['theme'] = dark ? 'dark' : 'light';
  }
}
