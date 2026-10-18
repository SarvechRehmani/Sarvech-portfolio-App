import { inject } from "@angular/core";
import { CmsService } from "./cms.service";
import { hydratePortfolio } from "../runtime/portfolio-data.js";
import { hydrateCatalog } from "./catalog.js";
import { Router, RedirectCommand } from "@angular/router";
export async function contentResolver() {
  const cms = inject(CmsService),
    router = inject(Router);
  try {
    const snapshot = await cms.load();
    hydratePortfolio(snapshot);
    hydrateCatalog(snapshot);
    return snapshot;
  } catch {
    return new RedirectCommand(router.parseUrl("/admin"));
  }
}
