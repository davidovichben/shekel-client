import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { catchError, throwError } from 'rxjs';
import { NetworkErrorDialogComponent } from '../../shared/components/network-error-dialog/network-error-dialog';

let isDialogOpen = false;

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const dialog = inject(MatDialog);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Skip dialog for client errors that should be handled by components
      const skipDialogStatuses = [401, 403, 422];

      if (!isDialogOpen && !skipDialogStatuses.includes(error.status)) {
        isDialogOpen = true;

        const dialogRef = dialog.open(NetworkErrorDialogComponent, {
          width: '400px',
          panelClass: 'confirm-dialog-panel',
          backdropClass: 'confirm-dialog-backdrop',
          enterAnimationDuration: '0ms',
          exitAnimationDuration: '0ms',
          data: {
            statusCode: error.status,
            message: error.message
          }
        });

        dialogRef.afterClosed().subscribe(() => {
          isDialogOpen = false;
        });
      }

      return throwError(() => error);
    })
  );
};
