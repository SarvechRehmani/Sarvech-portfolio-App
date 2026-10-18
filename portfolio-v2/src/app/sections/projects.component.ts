import {
  Component,
  ViewEncapsulation,
  signal,
  computed,
  afterEveryRender,
  ElementRef,
  inject,
} from "@angular/core";
import { projectsData } from "../runtime/portfolio-data.js";
import { projectNames, projectOrder } from "../core/catalog.js";
@Component({
  selector: "[portfolioProjects]",
  templateUrl: "./projects.component.html",
  encapsulation: ViewEncapsulation.None,
})
export class ProjectsComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly category = signal("all");
  readonly count = signal(3);
  readonly filters = [
    { id: "all", label: "All work" },
    { id: "fullstack", label: "Full-stack" },
    { id: "web", label: "Web apps" },
    { id: "desktop", label: "Desktop" },
  ];
  readonly projects = Object.entries(projectsData)
    .sort(([a], [b]) => projectOrder.indexOf(a) - projectOrder.indexOf(b))
    .map(([id, data]) => {
      const names = (projectNames as Record<string, string[]>)[id];
      return {
        ...data,
        id,
 slug:(data as any).slug||id,
        name: names[0],
        category: names[2],
        description: data.overview
          .replace(data.title, "")
          .trim()
          .replace(/^SyncBox is arobust/, "SyncBox is a robust"),
      };
    });
  readonly filtered = computed(() =>
    this.projects.filter(
      (p) => this.category() === "all" || p.category === this.category(),
    ),
  );
  readonly visible = computed(() => this.filtered().slice(0, this.count()));
  private pending: { previous: number; top: number } | null = null;
  constructor() {
    afterEveryRender(() => {
      if (!this.pending) return;
      const { previous, top } = this.pending;
      this.pending = null;
      const cards = Array.from(
        this.host.nativeElement.querySelectorAll<HTMLElement>(".project-card"),
      );
      window.scrollTo({ top, behavior: "instant" });
      cards.slice(previous).forEach((card, i) => {
        card.classList.add("visible");
        if (!matchMedia("(prefers-reduced-motion: reduce)").matches)
          card.animate(
            [
              { opacity: 0, transform: "translateY(18px)" },
              { opacity: 1, transform: "translateY(0)" },
            ],
            {
              duration: 380,
              delay: i * 60,
              easing: "cubic-bezier(.16,1,.3,1)",
              fill: "backwards",
            },
          );
      });
      if (this.count() >= this.filtered().length)
        cards[previous]?.focus({ preventScroll: true });
    });
  }
  filter(id: string): void {
    this.pending = { previous: 0, top: window.scrollY };
    this.category.set(id);
    this.count.set(3);
  }
  loadMore(): void {
    this.pending = { previous: this.visible().length, top: window.scrollY };
    this.count.update((value) => value + 2);
  }
}
