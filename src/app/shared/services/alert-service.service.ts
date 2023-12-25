import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class AlertServiceService {

  constructor(private messageService: MessageService, private translateService: TranslateService) { }

  success(message: string, summary?: string, messageCtx?: {[key: string]: string}, options?: any){
    this.messageService.add({
      severity: 'success',
      detail: message ? this.translateService.instant(message, messageCtx) : null,
      summary: summary ? this.translateService.instant(summary, messageCtx) : null,
      life: options?.life ? options.life : 5000
    });
  }

  error(message: string, summary?: string, messageCtx?: {[key: string]: string}, options?: any){
    this.messageService.add({
      severity: 'error',
      detail: message ? this.translateService.instant(message, messageCtx) : null,
      summary: summary ? this.translateService.instant(summary, messageCtx) : null,
      life: options?.life ? options.life : 5000
    });
  }

  warning(message: string, summary?: string, messageCtx?: {[key: string]: string}, options?: any){
    this.messageService.add({
      severity: 'warning',
      detail: message ? this.translateService.instant(message, messageCtx) : null,
      summary: summary ? this.translateService.instant(summary, messageCtx) : null,
      life: options?.life ? options.life : 5000
    });
  }

  info(message: string, summary?: string, messageCtx?: {[key: string]: string}, options?: any){
    this.messageService.add({
      severity: 'info',
      detail: message ? this.translateService.instant(message, messageCtx) : null,
      summary: summary ? this.translateService.instant(summary, messageCtx) : null,
      life: options?.life ? options.life : 5000
    });
  }
}
