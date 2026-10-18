import {ImageCropperComponent} from './app/shared/image-cropper.component';
import {ToastsComponent} from './app/shared/toasts.component';
import {MaintenanceExpiry} from './app/core/maintenance-expiry';
import {MaintenanceComponent} from './app/shared/maintenance.component';
import {CmsService} from './app/core/cms.service';
import {contentResolver} from './app/core/content-resolver';
import {provideHttpClient} from '@angular/common/http';
import {provideAppInitializer} from '@angular/core';
import {ApiConfigService} from './app/core/api-config.service';
import {adminGuard} from './app/core/admin.guard';
import { bootstrapApplication } from "@angular/platform-browser";
import { Component, inject, signal, effect, DestroyRef } from "@angular/core";
import {
  provideRouter,
  RouterOutlet,
  RouteReuseStrategy,
  Router, NavigationEnd,
  withInMemoryScrolling,
} from "@angular/router";
import { PageReuseStrategy } from "./app/core/page-reuse.strategy";
import { NavigationService } from "./app/core/navigation.service";
import { HomePageComponent } from "./app/pages/home-page.component";
import { ProjectPageComponent } from "./app/pages/project-page.component";

@Component({
  selector: "app-root",
  imports: [RouterOutlet,MaintenanceComponent,ToastsComponent,ImageCropperComponent],
  template: `@if(maintenance()){<portfolio-maintenance/>}<div [hidden]="maintenance()"><router-outlet /></div><portfolio-toasts/><studio-image-cropper/>`,
})
class AppComponent {
  private cms=inject(CmsService);private router=inject(Router);private path=signal(location.pathname);
  maintenance(){const query=new URLSearchParams(location.search);return !this.path().startsWith('/admin')&&!query.has('draft')&&((query.has('preview')&&query.get('maintenance')==='1'&&this.cms.admin())||(!query.has('preview')&&this.cms.snapshot()['layout']?.maintenance_enabled===true));}
  constructor() {
    const expiry=new MaintenanceExpiry(()=>location.reload());
    effect(()=>{const query=new URLSearchParams(location.search),layout=this.cms.snapshot()['layout'];expiry.schedule(!this.path().startsWith('/admin')&&!query.has('draft')&&!query.has('preview')&&layout?.maintenance_enabled===true,layout?.maintenance_until);});
    inject(DestroyRef).onDestroy(()=>expiry.clear());
    inject(NavigationService).start();
    this.router.events.subscribe(event=>{if(event instanceof NavigationEnd)this.path.set(event.urlAfterRedirects);});
  }
}

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideAppInitializer(()=>inject(ApiConfigService).load()),
    { provide: RouteReuseStrategy, useClass: PageReuseStrategy },
    provideRouter(
      [
        { path: "", pathMatch: "full", component: HomePageComponent, runGuardsAndResolvers:'paramsOrQueryParamsChange', resolve:{content:contentResolver} },
        { path: "index.html", component: HomePageComponent, resolve:{content:contentResolver} },
        {
          path: "project.html",
          component: ProjectPageComponent,
 resolve:{content:contentResolver},
          runGuardsAndResolvers: "paramsOrQueryParamsChange",
        },
        {path:'recruiter',loadComponent:()=>import('./app/pages/recruiter-page.component').then(m=>m.RecruiterPageComponent),resolve:{content:contentResolver},runGuardsAndResolvers:'paramsOrQueryParamsChange'},
        {path:'projects/:slug',component:ProjectPageComponent,resolve:{content:contentResolver},runGuardsAndResolvers:'always'},
{path:'blog',loadComponent:()=>import('./app/pages/blog.component').then(m=>m.BlogComponent),resolve:{content:contentResolver}},
{path:'blog/:slug',loadComponent:()=>import('./app/pages/blog.component').then(m=>m.BlogComponent),resolve:{content:contentResolver}},
{canDeactivate:[(component:any)=>component.canLeaveEditor()],path:'admin/login',loadComponent:()=>import('./app/admin/admin.component').then(m=>m.AdminComponent)},
{canDeactivate:[(component:any)=>component.canLeaveEditor()],path:'admin',canActivate:[adminGuard],loadComponent:()=>import('./app/admin/admin.component').then(m=>m.AdminComponent)},
{ path: "**", redirectTo: "" },
      ],
      withInMemoryScrolling({
        scrollPositionRestoration: "enabled",
        anchorScrolling: "enabled",
      }),
    ),
  ],
}).catch((error) => {
  document.documentElement.classList.remove("booting");
  console.error(error);
});
