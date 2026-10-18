import { Injectable, inject } from "@angular/core";
import { NavigationEnd, NavigationStart, Router } from "@angular/router";

/** Retains the original 220ms exit blur and 550ms arrival motion with Angular routing. */
@Injectable({ providedIn: "root" })
export class NavigationService {
  private readonly router = inject(Router);
  private started = false;
  private navigating = false;
  start(): void {
    if (this.started) return;
    this.started = true;
    let first = true;
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        if (!first) {
          document.documentElement.classList.remove("booting", "page-leaving");
          document.documentElement.classList.add("page-arriving");
        }
        first = false;
      }
      if (event instanceof NavigationEnd) this.navigating = false;
    });
    document.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      const link = target?.closest<HTMLAnchorElement>("a[href]");
      if (
        !link ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        link.hasAttribute("download") ||
        (link.target && link.target !== "_self")
      )
        return;
      const url = new URL(link.href, location.href);
      if (
        url.origin !== location.origin ||
        !/^\/(?:index\.html|project\.html|projects\/[^/]+|blog(?:\/[^/]+)?|admin)?$/.test(url.pathname)
      )
        return;
      if (url.pathname === location.pathname && url.search === location.search)
        return;
      event.preventDefault();
      if (this.navigating) return;
      this.navigating = true;
      document.documentElement.classList.add("page-leaving");
      setTimeout(
        () => {
          void this.router
            .navigateByUrl(url.pathname + url.search + url.hash)
            .finally(() => {
              this.navigating = false;
            });
        },
        matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 220,
      );
    });
  }
}
