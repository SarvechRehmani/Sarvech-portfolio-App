import {trackedLink} from './link-analytics';
import { Injectable, NgZone, inject } from "@angular/core";
import { mountPortfolio } from "../runtime/portfolio-runtime.js";
import { createRuntimeScope } from "../runtime/runtime-scope.js";
import {CmsService} from './cms.service';
import {ContentRendererService} from './content-renderer.service';
import {ResumeService} from './resume.service';
import {AnalyticsService} from './analytics.service';
import {BrandService} from './brand.service';

/** Owns the existing motion engine for exactly one Angular page lifetime. */
@Injectable({ providedIn: "root" })
export class PortfolioRuntimeService {
  private readonly zone = inject(NgZone);
  private readonly cms=inject(CmsService);
  private readonly renderer=inject(ContentRendererService);
  private readonly resume=inject(ResumeService);
  private readonly analytics=inject(AnalyticsService);
  private readonly brand=inject(BrandService);
  mount(): () => void {
    const scope = createRuntimeScope();
    const layout=this.cms.snapshot()['layout'];
    const query=new URLSearchParams(location.search),maintenancePreview=query.has('preview')&&query.get('maintenance')==='1'&&this.cms.admin();
    if(maintenancePreview||layout?.maintenance_enabled&&!query.has('preview')&&!this.cms.sharedPreview()){this.brand.apply();document.documentElement.classList.remove('booting','page-leaving');return ()=>scope.destroy();}
    document.documentElement.dataset['loaderEnabled']=String(layout?.loader_enabled!==false);
    if (!document.querySelector("#project-detail")) {
      document.title = String(this.cms.snapshot().profile["seo_title"]||this.cms.snapshot().profile["name"]);
      document
        .querySelector('meta[name="description"]')
        ?.setAttribute(
          "content",
          String(this.cms.snapshot().profile["seo_description"]||""),
        );
    }
    this.brand.appearance();
    this.zone.runOutsideAngular(() => mountPortfolio(scope));
    this.renderer.apply();
    this.brand.apply();this.brand.layout();
    const unbindResume=this.resume.bind();
    this.analytics.event('visit',location.pathname);
    const track=(event:Event)=>{const a=(event.target as Element)?.closest?.('a[href]');if(!a||a.hasAttribute('download'))return;const item=trackedLink(a.getAttribute('href')||'',location.origin);if(item)this.analytics.event(item.type,item.label);};
    document.addEventListener('click',track);
    return () => {
      scope.destroy();
      unbindResume();document.removeEventListener('click',track);
      document.querySelector(".site-loader")?.remove();
      document.body.style.overflow = "";
    };
  }
}
