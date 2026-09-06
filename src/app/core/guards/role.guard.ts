import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  UrlTree
} from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {
    if (!this.authService.isAuthenticated()) {
      return this.router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url }
      });
    }

    const expectedRoles: string[] = route.data['roles'];

    if (!expectedRoles || expectedRoles.length === 0) {
      return true;
    }

    if (this.authService.hasAnyRole(expectedRoles)) {
      return true;
    }

    // Role check failed -> redirect to Access Denied
    return this.router.createUrlTree(['/app/access-denied']);
  }
}
