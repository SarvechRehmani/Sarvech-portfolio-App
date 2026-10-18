import {
  Component,
  afterNextRender,
  DestroyRef,
  inject,
  ViewEncapsulation,
} from "@angular/core";
import { PortfolioRuntimeService } from "../core/portfolio-runtime.service";
import { ProjectHeaderComponent } from "../shared/shell.components";
import { ProjectFooterComponent } from "../shared/shell.components";
import { ProjectDialogComponent } from "../shared/shell.components";
import {CmsService} from '../core/cms.service';
@Component({
  selector: "portfolio-project-page",
  imports: [
    ProjectHeaderComponent,
    ProjectFooterComponent,
    ProjectDialogComponent,
  ],
  templateUrl: "./project-page.component.html",
  encapsulation: ViewEncapsulation.None,
})
export class ProjectPageComponent {
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
