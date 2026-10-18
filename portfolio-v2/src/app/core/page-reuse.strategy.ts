import { Injectable } from "@angular/core";
import {
  ActivatedRouteSnapshot,
  BaseRouteReuseStrategy,
} from "@angular/router";

/** A different project ID needs its own gallery and lifecycle resources. */
@Injectable()
export class PageReuseStrategy extends BaseRouteReuseStrategy {
  override shouldReuseRoute(
    future: ActivatedRouteSnapshot,
    current: ActivatedRouteSnapshot,
  ): boolean {
    return (
      future.routeConfig === current.routeConfig &&
      future.queryParams["id"] === current.queryParams["id"] && future.params['slug']===current.params['slug'] && future.queryParams['draft']===current.queryParams['draft'] && future.queryParams['preview']===current.queryParams['preview']
    );
  }
}
