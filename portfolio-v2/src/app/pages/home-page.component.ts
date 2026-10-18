import {AdditionalComponent} from '../sections/additional.component';
import {CmsService} from '../core/cms.service';
import {
  Component,
  afterNextRender,
  DestroyRef,
  inject,
  ViewEncapsulation,
} from "@angular/core";
import { PortfolioRuntimeService } from "../core/portfolio-runtime.service";
import { HomeHeaderComponent } from "../shared/shell.components";
import { HomeFooterComponent } from "../shared/shell.components";
import { HomeDialogComponent } from "../shared/shell.components";
import { HeroComponent } from "../sections/hero.component";
import { AboutComponent } from "../sections/about.component";
import { ExperienceComponent } from "../sections/experience.component";
import { SkillsComponent } from "../sections/skills.component";
import { ProjectsComponent } from "../sections/projects.component";
import { CertificatesComponent } from "../sections/certificates.component";
import { ContactComponent } from "../sections/contact.component";
@Component({
  selector: "portfolio-home-page",
  imports: [
    HomeHeaderComponent,
    HomeFooterComponent,
    HomeDialogComponent,
    HeroComponent,
    AboutComponent,
    ExperienceComponent,
    SkillsComponent,
    ProjectsComponent,
    CertificatesComponent,
    ContactComponent,
 AdditionalComponent,
  ],
  templateUrl: "./home-page.component.html",
  encapsulation: ViewEncapsulation.None,
})
export class HomePageComponent {
  readonly cms=inject(CmsService);
  constructor() {
    const runtime = inject(PortfolioRuntimeService);
    const destroy = inject(DestroyRef);
    afterNextRender(() => {
      const cleanup = runtime.mount();
      destroy.onDestroy(cleanup);
    });
  }
}
