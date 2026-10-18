import {
  Component,
  ViewEncapsulation,
  signal,
  computed,
  ElementRef,
  inject,
} from "@angular/core";
import { skillGroups, skillConnections } from "../core/catalog.js";
@Component({
  selector: "[portfolioSkills]",
  templateUrl: "./skills.component.html",
  encapsulation: ViewEncapsulation.None,
})
export class SkillsComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly groups = skillGroups.map((g) => ({
    icon: "fa-solid " + g[0],
    title: g[1] as string,
    description: g[2] as string,
    names: g[3] as string[],
  }));
  readonly all = this.groups.flatMap((g) => g.names);
  readonly pinned = signal<string | null>(null);
  readonly hovered = signal<string | null>(null);
  readonly focused = signal<string | null>(null);
  readonly active = computed(
    () => this.hovered() || this.focused() || this.pinned(),
  );
  readonly group = computed(() =>
    this.groups.find((g) => g.names.includes(this.active() || "")),
  );
  readonly connections = computed(() =>
    this.active()
      ? ((skillConnections as Record<string,string[]>)[this.active()!]||[]).filter((name:string)=>name!==this.active()&&this.all.includes(name))
      : [],
  );
  hover(event: PointerEvent, name: string): void {
    if (event.pointerType !== "touch") this.hovered.set(name);
  }
  focus(event: FocusEvent, name: string): void {
    if ((event.target as HTMLElement).matches(":focus-visible"))
      this.focused.set(name);
  }
  reset(): void {
    this.host.nativeElement
      .querySelector<HTMLButtonElement>(".skill-node")
      ?.focus({ preventScroll: true });
    this.pinned.set(null);
    this.hovered.set(null);
    this.focused.set(null);
  }
}

