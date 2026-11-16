export type Category = {
  name: string
  description: string
  image: string
}

export type Product = {
  id: string
  sku?: string
  barcode?: string
  name: string
  category: string
  brand?: string
  price: number
  stock?: number | null
  description?: string
  image?: string
  offer?: boolean
  discount?: string
  oldPrice?: number
  available: boolean
  demo?: boolean
  sourceRow?: number
  categoryReview?: boolean
  imageSource?: 'posberry' | 'open-food-facts' | 'local-ean'
  imageCreditUrl?: string
  imageLicense?: string
}

export const categories: Category[] = [
  { name: 'Aceites, aderezos y vinagres', description: 'Aceites y aderezos para tus comidas', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=500&q=80' },
  { name: 'Almacén', description: 'Despensa para todos los días', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80' },
  { name: 'Arroz, legumbres y pastas', description: 'Clásicos para todos los días', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=500&q=80' },
  { name: 'Bazar', description: 'Artículos prácticos para tu hogar', image: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=500&q=80' },
  { name: 'Bebés', description: 'Productos para los más chicos', image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=500&q=80' },
  { name: 'Bebidas con alcohol', description: 'Opciones para compartir', image: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?auto=format&fit=crop&w=500&q=80' },
  { name: 'Bebidas sin alcohol', description: 'Refrescá tus momentos', image: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?auto=format&fit=crop&w=500&q=80' },
  { name: 'Caldos, condimentos y especias', description: 'Sabor para cada preparación', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80' },
  { name: 'Carnicería', description: 'Opciones para tus comidas', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80' },
  { name: 'Cigarrillos y tabaco', description: 'Productos seleccionados', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80' },
  { name: 'Congelados', description: 'Prácticos y ricos', image: 'https://images.unsplash.com/photo-1481391032119-d89fee407e44?auto=format&fit=crop&w=500&q=80' },
  { name: 'Panadería', description: 'Panificados para cada momento', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80' },
  { name: 'Papeles', description: 'Productos esenciales para el hogar', image: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=500&q=80' },
  { name: 'Snacks', description: 'Algo rico para picar', image: 'https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=500&q=80' },
  { name: 'Tecnología e informática', description: 'Tecnología para todos los días', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80' },
]

export const products: Product[] = [
  { id: 'demo-1', sku: 'DEMO-001', name: 'Coca Cola 2,25 L', category: 'Bebidas sin alcohol', price: 3500, image: 'https://images.unsplash.com/photo-1629203849820-fdd70d49c38e?auto=format&fit=crop&w=700&q=80', available: true, demo: true },
  { id: 'demo-2', sku: 'DEMO-002', name: 'Yerba Playadito 1 kg', category: 'Almacén', price: 4200, image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=700&q=80', available: true, demo: true },
  { id: 'demo-3', sku: 'DEMO-003', name: 'Pizza lista para hornear', category: 'Congelados', price: 12000, image: 'https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=700&q=80', available: true, offer: true, discount: '-15%', oldPrice: 14100, demo: true },
  { id: 'demo-4', sku: 'DEMO-004', name: 'Aceite Natura 900 ml', category: 'Aceites, aderezos y vinagres', price: 2800, image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=700&q=80', available: true, demo: true },
  { id: 'demo-5', sku: 'DEMO-005', name: 'Arroz Gallo 1 kg', category: 'Arroz, legumbres y pastas', price: 1900, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=700&q=80', available: true, demo: true },
  { id: 'demo-6', sku: 'DEMO-006', name: 'Leche entera 1 L', category: 'Almacén', price: 1600, image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=700&q=80', available: true, offer: true, discount: '-10%', oldPrice: 1780, demo: true },
  { id: 'demo-7', sku: 'DEMO-007', name: 'Pan de molde blanco', category: 'Panadería', price: 2400, image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=700&q=80', available: true, demo: true },
  { id: 'demo-8', sku: 'DEMO-008', name: 'Jabón líquido 3 L', category: 'Bazar', price: 5800, image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=700&q=80', available: true, demo: true },
]
