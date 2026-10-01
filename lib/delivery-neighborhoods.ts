export type DeliveryZone = 'Norte' | 'Sur'

export type Neighborhood = {
  name: string
  zone: DeliveryZone
}

/**
 * DATOS TEMPORALES / MOCK.
 *
 * Esta clasificación todavía debe ser revisada y completada por el equipo del
 * Market. Agregá, quitá o corregí barrios únicamente en esta lista central.
 */
export const NEIGHBORHOODS: readonly Neighborhood[] = [
  { name: 'General Mosconi', zone: 'Norte' },
  { name: 'Pueyrredón', zone: 'Sur' },
  { name: 'Centro', zone: 'Sur' },
]

export const OTHER_NEIGHBORHOOD = 'Otro / No encuentro mi barrio'

export function findNeighborhood(name: string): Neighborhood | undefined {
  return NEIGHBORHOODS.find((neighborhood) => neighborhood.name === name)
}

export function deliveryZoneForNeighborhood(name: string): DeliveryZone | undefined {
  return findNeighborhood(name)?.zone
}
