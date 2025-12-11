import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Skip auth header for login endpoint
  if (req.url.includes('/login')) {
    return next(req);
  }

  const token = localStorage.getItem('auth_token');

  if (token && token !== 'undefined' && token !== 'null') {
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(clonedReq);
  }

  return next(req);
};
