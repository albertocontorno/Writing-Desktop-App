import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'execute'
})
export class ExecutePipe implements PipeTransform {

  transform(value: unknown, fn: (...args) => any, context?, ...args: unknown[]): any {
    console.log('execute fn')
    if(context){
      return fn.call(context, value, ...args);
    } 
    return fn(value, ...args);
  }

}
