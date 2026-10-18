import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { CmsService } from "./cms.service";
export const adminGuard: CanActivateFn = async () => {
  const cms = inject(CmsService),
    router = inject(Router);
  try {
    await cms.verify();
    return true;
  } catch {
    return router.createUrlTree(["/admin/login"]);
  }
};
