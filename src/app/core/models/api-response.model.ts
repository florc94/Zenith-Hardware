// Modelo genérico para envolver respuestas paginadas de la API.
// Mantener esto centralizado facilita adaptar el front si el backend
// cambia el formato de paginación (offset, cursor, etc).
export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
