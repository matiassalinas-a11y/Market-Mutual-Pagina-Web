export type DeliveryZone = 'Norte' | 'Sur'

export type Neighborhood = {
  name: string
  zone: DeliveryZone
}

/**
 * Listado configurable provisto para la etapa 2.1.
 * Agregá, quitá o corregí barrios únicamente en esta lista central.
 */
export const NEIGHBORHOODS: readonly Neighborhood[] = [
  { name: 'Centro', zone: 'Sur' },
  { name: 'General Don Bosco / Rada Tilly (zona de influencia urbana)', zone: 'Sur' },
  { name: 'San Martín', zone: 'Sur' },
  { name: 'Jorge Newbery', zone: 'Sur' },
  { name: 'José Fuchs', zone: 'Sur' },
  { name: 'Máximo Abásolo', zone: 'Sur' },
  { name: 'Pueyrredón', zone: 'Sur' },
  { name: 'Ceferino Namuncurá', zone: 'Sur' },
  { name: 'San Cayetano', zone: 'Sur' },
  { name: 'Abel Amaya', zone: 'Sur' },
  { name: 'Stella Maris', zone: 'Sur' },
  { name: 'Fracción 14 y 15', zone: 'Sur' },
  { name: 'Cerro Solo', zone: 'Sur' },
  { name: 'Juan XXIII', zone: 'Sur' },
  { name: 'La Floresta', zone: 'Sur' },
  { name: 'Quirno Costa', zone: 'Sur' },
  { name: 'Moure', zone: 'Sur' },
  { name: 'Pietrobelli', zone: 'Sur' },
  { name: '30 de Octubre', zone: 'Sur' },
  { name: 'Las Flores', zone: 'Sur' },
  { name: 'Los Tres Pinos', zone: 'Sur' },
  { name: 'General Mosconi (Kilómetro 3)', zone: 'Norte' },
  { name: 'Palazzo (Kilómetro 9)', zone: 'Norte' },
  { name: 'Astra', zone: 'Norte' },
  { name: 'Diadema Argentina', zone: 'Norte' },
  { name: 'Don Bosco (Kilómetro 8)', zone: 'Norte' },
  { name: 'Laprida', zone: 'Norte' },
  { name: 'Manantial Rosales', zone: 'Norte' },
  { name: 'Standard Norte y Standard Sur', zone: 'Norte' },
  { name: 'Franja Forestal Cerro de la Cruz', zone: 'Norte' },
]

export const OTHER_NEIGHBORHOOD = 'Otro / No encuentro mi barrio'

export function findNeighborhood(name: string): Neighborhood | undefined {
  return NEIGHBORHOODS.find((neighborhood) => neighborhood.name === name)
}

export function deliveryZoneForNeighborhood(name: string): DeliveryZone | undefined {
  return findNeighborhood(name)?.zone
}
