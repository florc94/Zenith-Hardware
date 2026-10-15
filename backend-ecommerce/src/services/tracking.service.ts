export function buildTrackCode(id: number): string {
  return `ZH-${id.toString(36).toUpperCase()}7H${id}ZN`;
}