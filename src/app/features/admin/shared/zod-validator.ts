import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { ZodType } from 'zod';

/**
 * Puente entre Zod y Reactive Forms. En un stack React se usaría
 * @hookform/resolvers/zod para esto mismo; acá logramos lo mismo sin
 * atarnos a una librería de forms específica: un validador de grupo
 * que corre el schema sobre `form.getRawValue()` y reparte cada issue
 * de Zod al control que corresponde (`form.get(issue.path)`).
 *
 * Se aplica a nivel de FormGroup (no de control individual) porque
 * Zod valida el objeto completo de una — así se puede usar `.refine()`
 * para reglas que cruzan varios campos si hiciera falta más adelante.
 */
export function zodValidator(schema: ZodType<unknown>): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const result = schema.safeParse(control.getRawValue());
    if (result.success) return null;

    for (const issue of result.error.issues) {
      const path = issue.path.join('.');
      const target = path ? control.get(path) : control;
      if (target) {
        target.setErrors({ ...target.errors, zod: issue.message });
      }
    }

    return { zod: true };
  };
}

/** Azúcar sintáctica para leer el mensaje de Zod de un control en el template. */
export function zodError(control: AbstractControl | null): string | null {
  return control?.errors?.['zod'] ?? null;
}
