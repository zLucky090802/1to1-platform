import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, switchMap, BehaviorSubject, filter, take } from 'rxjs';
import { TokenService } from '../services/token.service';
import { AuthService }  from '../services/auth.service';

let isRefreshing = false;
const refreshDone$ = new BehaviorSubject<boolean>(false);

const AUTH_ROUTES = ['/auth/login', '/auth/register', '/auth/refresh'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenSvc = inject(TokenService);
  const authSvc  = inject(AuthService);

  const isAuthRoute = AUTH_ROUTES.some(r => req.url.includes(r));
  if (isAuthRoute) return next(req);

  const token = tokenSvc.get();
  const authed = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` }, withCredentials: true })
    : req.clone({ withCredentials: true });

  return next(authed).pipe(
    catchError(err => {
      if (err instanceof HttpErrorResponse && err.status === 401 && err.error?.error === 'TOKEN_EXPIRED') {
        if (isRefreshing) {
          return refreshDone$.pipe(
            filter(done => done),
            take(1),
            switchMap(() => {
              const newToken = tokenSvc.get();
              const retried = newToken
                ? req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` }, withCredentials: true })
                : req;
              return next(retried);
            })
          );
        }

        isRefreshing = true;
        refreshDone$.next(false);

        return authSvc.refreshAccessToken().pipe(
          switchMap(() => {
            isRefreshing = false;
            refreshDone$.next(true);
            const newToken = tokenSvc.get();
            const retried = newToken
              ? req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` }, withCredentials: true })
              : req;
            return next(retried);
          }),
          catchError(refreshErr => {
            isRefreshing = false;
            authSvc.logout();
            return throwError(() => refreshErr);
          })
        );
      }
      return throwError(() => err);
    })
  );
};