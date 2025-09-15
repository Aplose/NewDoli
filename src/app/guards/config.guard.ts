import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ConfigService } from '../services/config.service';

@Injectable({
  providedIn: 'root'
})
export class ConfigGuard implements CanActivate {
  constructor(
    private configService: ConfigService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.checkConfiguration();
  }

  private checkConfiguration(): Observable<boolean> {
    return new Observable(observer => {
      this.configService.isConfigurationComplete().then(isComplete => {
        if (isComplete) {
          observer.next(true);
          observer.complete();
        } else {
          this.router.navigate(['/config']);
          observer.next(false);
          observer.complete();
        }
      }).catch(error => {
        console.error('Error checking configuration:', error);
        this.router.navigate(['/config']);
        observer.next(false);
        observer.complete();
      });
    });
  }
}
