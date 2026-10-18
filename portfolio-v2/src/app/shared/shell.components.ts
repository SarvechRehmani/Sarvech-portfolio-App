import { Component, ViewEncapsulation } from "@angular/core";
@Component({
  selector: "[portfolioHomeHeader]",
  templateUrl: "./home-header.component.html",
  encapsulation: ViewEncapsulation.None,
})
export class HomeHeaderComponent {}

@Component({
  selector: "[portfolioHomeFooter]",
  templateUrl: "./home-footer.component.html",
  encapsulation: ViewEncapsulation.None,
})
export class HomeFooterComponent {}

@Component({
  selector: "[portfolioHomeDialog]",
  templateUrl: "./home-dialog.component.html",
  encapsulation: ViewEncapsulation.None,
})
export class HomeDialogComponent {}

@Component({
  selector: "[portfolioProjectHeader]",
  templateUrl: "./project-header.component.html",
  encapsulation: ViewEncapsulation.None,
})
export class ProjectHeaderComponent {}

@Component({
  selector: "[portfolioProjectFooter]",
  templateUrl: "./project-footer.component.html",
  encapsulation: ViewEncapsulation.None,
})
export class ProjectFooterComponent {}

@Component({
  selector: "[portfolioProjectDialog]",
  templateUrl: "./project-dialog.component.html",
  encapsulation: ViewEncapsulation.None,
})
export class ProjectDialogComponent {}
