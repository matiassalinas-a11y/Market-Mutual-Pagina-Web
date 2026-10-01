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
  // ZONA NORTE
  { name: '25 de Mayo', zone: 'Norte' },
  { name: 'Acceso Noroeste', zone: 'Norte' },
  { name: 'Ara San Juan', zone: 'Norte' },
  { name: 'Astra', zone: 'Norte' },
  { name: 'Bella Vista Norte', zone: 'Norte' },
  { name: 'Caleta Córdova', zone: 'Norte' },
  { name: 'Centenario', zone: 'Norte' },
  { name: 'Chacras El Faro', zone: 'Norte' },
  { name: 'Chacras Km 17', zone: 'Norte' },
  { name: 'Chacras Km 18', zone: 'Norte' },
  { name: 'Ciudadela', zone: 'Norte' },
  { name: 'Cuarteles de Chacabuco', zone: 'Norte' },
  { name: 'Diadema Argentina', zone: 'Norte' },
  { name: 'Doctor René Gerónimo Favaloro', zone: 'Norte' },
  { name: 'Don Bosco Km 8', zone: 'Norte' },
  { name: 'Franja Forestal Cerro de la Cruz', zone: 'Norte' },
  { name: 'Gasoducto', zone: 'Norte' },
  { name: 'General Enrique Mosconi', zone: 'Norte' },
  { name: 'Gesta de Malvinas', zone: 'Norte' },
  { name: 'Gobernador Fontana', zone: 'Norte' },
  { name: 'Güemes', zone: 'Norte' },
  { name: 'Juan José Castelli', zone: 'Norte' },
  { name: 'Laprida', zone: 'Norte' },
  { name: 'Las Orquídeas', zone: 'Norte' },
  { name: 'Manantial Rosales', zone: 'Norte' },
  { name: 'Nicolás Rodríguez Peña', zone: 'Norte' },
  { name: 'Nuestra Señora de la Divina Providencia', zone: 'Norte' },
  { name: 'Padre Juan Corti', zone: 'Norte' },
  { name: 'Presidente Roberto M. Ortiz', zone: 'Norte' },
  { name: 'Próspero Palazzo', zone: 'Norte' },
  { name: 'Restinga Alí', zone: 'Norte' },
  { name: 'Saavedra', zone: 'Norte' },
  { name: 'Sarmiento', zone: 'Norte' },
  { name: 'Standard Norte', zone: 'Norte' },
  { name: 'Standard Sur', zone: 'Norte' },
  { name: 'Zona de Aeropuerto', zone: 'Norte' },

  // ZONA SUR
  { name: '9 de Julio', zone: 'Sur' },
  { name: '30 de Octubre', zone: 'Sur' },
  { name: '13 de Diciembre', zone: 'Sur' },
  { name: 'Acceso Sur - Fracción 14 y 15', zone: 'Sur' },
  { name: 'Acceso Sur - Industrial', zone: 'Sur' },
  { name: 'Balcón del Paraíso', zone: 'Sur' },
  { name: 'Bella Vista Oeste', zone: 'Sur' },
  { name: 'Bella Vista Sur', zone: 'Sur' },
  { name: 'Ceferino Namuncurá', zone: 'Sur' },
  { name: 'Centro', zone: 'Sur' },
  { name: 'Centro Cívico General Solari', zone: 'Sur' },
  { name: 'Chacras Cañadones, La Francesa y Las Leñas', zone: 'Sur' },
  { name: 'Chacra La Herradura', zone: 'Sur' },
  { name: 'Chacras Loteo Freijoo, Vento y otros', zone: 'Sur' },
  { name: 'Chacras Loteo Quitani y otros', zone: 'Sur' },
  { name: 'Cordón Forestal Juan Manuel Feeney', zone: 'Sur' },
  { name: 'Doctor Quirno Costa', zone: 'Sur' },
  { name: 'El Atardecer', zone: 'Sur' },
  { name: 'Unión (Ex Radio Estación YPF)', zone: 'Sur' },
  { name: 'Francisco Pietrobelli', zone: 'Sur' },
  { name: 'Gobernador Roque González', zone: 'Sur' },
  { name: 'Humberto Beghin', zone: 'Sur' },
  { name: 'Jorge Newbery', zone: 'Sur' },
  { name: 'José Fuchs', zone: 'Sur' },
  { name: 'Juan XXIII', zone: 'Sur' },
  { name: 'Julio Argentino Roca', zone: 'Sur' },
  { name: 'La Floresta', zone: 'Sur' },
  { name: 'Las Flores', zone: 'Sur' },
  { name: 'Los Arenales', zone: 'Sur' },
  { name: 'Los Bretes', zone: 'Sur' },
  { name: 'Maestro Isidro Quiroga', zone: 'Sur' },
  { name: 'Malvinas Argentinas', zone: 'Sur' },
  { name: 'Mario Abel Amaya', zone: 'Sur' },
  { name: 'Máximo Abásolo', zone: 'Sur' },
  { name: 'Monseñor Argimiro Daniel Moure', zone: 'Sur' },
  { name: 'Parque Industrial', zone: 'Sur' },
  { name: 'Pueyrredón', zone: 'Sur' },
  { name: 'San Cayetano', zone: 'Sur' },
  { name: 'San Isidro Labrador', zone: 'Sur' },
  { name: 'San Martín', zone: 'Sur' },
  { name: 'Stella Maris', zone: 'Sur' },
]

export const OTHER_NEIGHBORHOOD = 'Otro / No encuentro mi barrio'

export function findNeighborhood(name: string): Neighborhood | undefined {
  return NEIGHBORHOODS.find((neighborhood) => neighborhood.name === name)
}

export function deliveryZoneForNeighborhood(name: string): DeliveryZone | undefined {
  return findNeighborhood(name)?.zone
}
