import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { I18nContext } from 'nestjs-i18n';

@Injectable()
export class I18nResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        const i18n = I18nContext.current();
        
        if (data && data.message && i18n) {
            // Pass data.args to the translation function
            data.message = i18n.t("messages." + data.message, { 
                args: data.args || {}, 
                defaultValue: data.message 
            });
            
            // Clean up the response so the user doesn't see the raw args object
            delete data.args; 
        }
        
        return data;
      }),
    );
  }
}