export type Category = {
  name: string
  description: string
  image: string
}

export type Product = {
  id: number
  name: string
  category: string
  price: number
  image: string
  offer?: string
  oldPrice?: number
  available: boolean
}

export const categories: Category[] = [
  { name: 'Almacén', description: 'Despensa para todos los días', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80' },
  { name: 'Bebidas', description: 'Refrescá tus momentos', image: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?auto=format&fit=crop&w=500&q=80' },
  { name: 'Lácteos', description: 'Frescura garantizada', image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=500&q=80' },
  { name: 'Limpieza', description: 'Tu casa siempre lista', image: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=500&q=80' },
  { name: 'Congelados', description: 'Prácticos y ricos', image: 'https://images.unsplash.com/photo-1481391032119-d89fee407e44?auto=format&fit=crop&w=500&q=80' },
]

export const products: Product[] = [
  { id: 1, name: 'Coca Cola 2,25 L', category: 'Bebidas', price: 3500, image: 'https://images.unsplash.com/photo-1629203849820-fdd70d49c38e?auto=format&fit=crop&w=700&q=80', available: true },
  { id: 2, name: 'Yerba Playadito 1 kg', category: 'Almacén', price: 4200, image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=700&q=80', available: true },
  { id: 3, name: 'Pizza lista para hornear', category: 'Congelados', price: 12000, image: 'https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=700&q=80', available: true, offer: '-15%', oldPrice: 14100 },
  { id: 4, name: 'Aceite Natura 900 ml', category: 'Almacén', price: 2800, image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=700&q=80', available: true },
  { id: 5, name: 'Arroz Gallo 1 kg', category: 'Almacén', price: 1900, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=700&q=80', available: true },
  { id: 6, name: 'Leche entera 1 L', category: 'Lácteos', price: 1600, image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=700&q=80', available: true, offer: '-10%', oldPrice: 1780 },
  { id: 7, name: 'Pan de molde blanco', category: 'Almacén', price: 2400, image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=700&q=80', available: true },
  { id: 8, name: 'Jabón líquido 3 L', category: 'Limpieza', price: 5800, image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=700&q=80', available: true },
]