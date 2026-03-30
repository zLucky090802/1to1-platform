import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      let message = 'Error inesperado. Intenta de nuevo.';

      if (err.error?.error)        message = err.error.error;
      else if (err.error?.message) message = err.error.message;
      else {
        switch (err.status) {
          case 0:   message = 'Sin conexión al servidor'; break;
          case 400: message = 'Datos inválidos';          break;
          case 403: message = 'No tienes permiso';        break;
          case 404: message = 'No encontrado';            break;
          case 409: message = 'El recurso ya existe';     break;
          case 500: message = 'Error del servidor';       break;
        }
      }

      return throwError(() => ({ ...err, userMessage: message }));
    })
  );
};