import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'maskCard'
})
export class MaskCardPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    try {
      return value.replace(/\d(?=\d{4})/g, '*');
    } catch (e) {
      return value;
    }
  }
}
