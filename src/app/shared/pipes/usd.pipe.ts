import { Pipe, PipeTransform } from '@angular/core';
import { formatCurrency } from '../../utils/formatCurrency';

@Pipe({
  name: 'usd',
  standalone: true,
})
export class UsdPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return formatCurrency(value ?? 0);
  }
}
