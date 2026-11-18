/* eslint-disable @typescript-eslint/no-require-imports -- Node's built-in test runner executes this CommonJS harness. */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const Module = require('node:module')
// Compile the actual pure domain rules, without a test-only reimplementation.
const filename = path.resolve('lib/admin/catalog-rules.ts')
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText
const mod = new Module(filename, module)
mod.filename = filename
mod.paths = module.paths
mod._compile(compiled, filename)
const { applyCatalogCommand, pricePreview, parsePriceInput } = mod.exports
test('Argentine price formatting does not confuse thousands and cents', () => {
  assert.equal(parsePriceInput('1.250,50'), 1250.5)
  assert.equal(parsePriceInput('$ 1.000'), 1000)
  assert.equal(parsePriceInput('155.50'), 155.5)
  assert.equal(parsePriceInput('155,50'), 155.5)
  for (const value of ['', '1e3', '1250,501', 'abc'])
    assert.ok(Number.isNaN(parsePriceInput(value)))
})
const product = {
  id: 'sku:1',
  sku: '1',
  barcode: '7790000000001',
  name: 'Producto A',
  category: 'Almacén',
  price: 100,
  stock: 4,
  available: true,
  image: '/products/original.webp',
  imageSource: 'local-ean',
}
const snapshot = () => ({
  revision: 3,
  families: ['Almacén', 'Bebidas'],
  products: [
    { ...product },
    {
      ...product,
      id: 'sku:2',
      sku: '2',
      barcode: '7790000000002',
      name: 'Producto B',
      price: 200,
    },
  ],
})
const draft = () => ({ ...product, featured: false })
test('new products have stable server-generated identity and preserve existing records', () => {
  const s = snapshot()
  const next = applyCatalogCommand(
    s,
    {
      type: 'save',
      product: {
        ...draft(),
        id: undefined,
        sku: '3',
        barcode: '',
        image: undefined,
      },
    },
    'admin:new',
  )
  assert.equal(next.products[2].id, 'admin:new')
  assert.deepEqual(next.products.slice(0, 2), s.products)
  assert.equal(next.revision, 4)
})
test('duplicate SKU is rejected without mutation', () => {
  const s = snapshot()
  assert.throws(
    () =>
      applyCatalogCommand(
        s,
        { type: 'save', product: { ...draft(), sku: '2' } },
        '',
      ),
    (e) => Boolean(e.fields.sku),
  )
  assert.equal(s.products[0].sku, '1')
})
test('duplicate EAN is rejected on new/changed codes', () =>
  assert.throws(
    () =>
      applyCatalogCommand(
        snapshot(),
        { type: 'save', product: { ...draft(), barcode: '7790000000002' } },
        '',
      ),
    (e) => Boolean(e.fields.barcode),
  ))
test('existing legacy duplicate EAN does not block editing other fields', () => {
  const s = snapshot()
  s.products[1].barcode = product.barcode
  assert.equal(
    applyCatalogCommand(
      s,
      { type: 'save', product: { ...draft(), price: 105 } },
      '',
    ).products[0].price,
    105,
  )
})
test('price rejects zero, negative, NaN, infinity, fractions beyond cents and huge values', () => {
  for (const price of [0, -1, NaN, Infinity, 1.001, 1e10])
    assert.throws(() =>
      applyCatalogCommand(
        snapshot(),
        { type: 'prices', changes: [{ id: product.id, price }] },
        '',
      ),
    )
})
test('families and inventory are validated server-side', () => {
  for (const change of [
    { category: 'Inventada' },
    { stock: -1 },
    { stock: 1.5 },
  ])
    assert.throws(() =>
      applyCatalogCommand(
        snapshot(),
        { type: 'save', product: { ...draft(), ...change } },
        '',
      ),
    )
})
test('price batches are atomic when one change is invalid', () => {
  const s = snapshot()
  assert.throws(() =>
    applyCatalogCommand(
      s,
      {
        type: 'prices',
        changes: [
          { id: 'sku:1', price: 110 },
          { id: 'sku:2', price: 0 },
        ],
      },
      '',
    ),
  )
  assert.equal(s.products[0].price, 100)
})
test('preview roundings are the same values applied; stock/images/families remain intact', () => {
  const s = snapshot()
  const preview = pricePreview(s.products, ['sku:1', 'sku:2'], 12.345)
  const n = applyCatalogCommand(
    s,
    {
      type: 'prices',
      changes: preview.map(({ id, price }) => ({ id, price })),
    },
    '',
  )
  assert.equal(n.products[0].price, 112.35)
  assert.equal(n.products[1].price, 224.69)
  for (const p of n.products) {
    assert.equal(p.stock, 4)
    assert.equal(p.category, 'Almacén')
    assert.equal(p.image, product.image)
  }
})
test('invalid percentage bounds are rejected', () => {
  for (const value of [-100, -101, NaN, Infinity, 1001])
    assert.throws(() => pricePreview(snapshot().products, ['sku:1'], value))
})
test('deactivation preserves data and stable cart identity', () => {
  const n = applyCatalogCommand(
    snapshot(),
    { type: 'flags', id: 'sku:1', available: false },
    '',
  )
  assert.deepEqual(n.products[0], { ...product, available: false })
})
test('featured order must include exactly the current highlighted products', () => {
  const s = snapshot()
  s.products.forEach((p) => (p.featured = true))
  assert.throws(() =>
    applyCatalogCommand(
      s,
      { type: 'featured-order', ids: ['sku:1', 'sku:1'] },
      '',
    ),
  )
  const n = applyCatalogCommand(
    s,
    { type: 'featured-order', ids: ['sku:2', 'sku:1'] },
    '',
  )
  assert.equal(n.products[0].featuredOrder, 1)
  assert.equal(n.products[1].featuredOrder, 0)
})
test('external and inline image URLs cannot be injected', () => {
  for (const image of [
    'javascript:alert(1)',
    'data:image/svg+xml,xxx',
    'https://example.com/a.png',
  ])
    assert.throws(() =>
      applyCatalogCommand(
        snapshot(),
        { type: 'save', product: { ...draft(), image } },
        '',
      ),
    )
})

test('flyer list preserves products and existing images while reordering/removing', () => {
  const s = snapshot()
  s.flyers = [
    {
      id: 'delivery',
      title: 'Envíos',
      image: '/flyers/envios-market-mutual.png',
      href: '#entregas',
    },
    {
      id: 'kettle',
      title: 'Pava',
      image: '/flyers/pava-smart-life.png',
      href: '#productos',
    },
  ]
  const result = applyCatalogCommand(
    s,
    { type: 'flyers', flyers: [s.flyers[1], s.flyers[0]] },
    '',
  )
  assert.deepEqual(result.products, s.products)
  assert.deepEqual(
    result.flyers.map((f) => f.id),
    ['kettle', 'delivery'],
  )
  assert.equal(result.flyers[1].image, '/flyers/envios-market-mutual.png')
  assert.equal(
    applyCatalogCommand(s, { type: 'flyers', flyers: [] }, '').flyers.length,
    0,
  )
})
test('a maximum of five flyers is enforced on the server', () => {
  const s = snapshot()
  const flyer = {
    id: 'a',
    title: 'Promoción',
    image: '/api/catalog/images/00000000-0000-0000-0000-000000000000.webp',
  }
  assert.equal(
    applyCatalogCommand(
      s,
      {
        type: 'flyers',
        flyers: Array.from({ length: 5 }, (_, i) => ({
          ...flyer,
          id: String(i),
        })),
      },
      '',
    ).flyers.length,
    5,
  )
  assert.throws(
    () =>
      applyCatalogCommand(
        s,
        {
          type: 'flyers',
          flyers: Array.from({ length: 6 }, (_, i) => ({
            ...flyer,
            id: String(i),
          })),
        },
        '',
      ),
    /máximo de 5/,
  )
})
test('flyers reject duplicate identifiers, missing names and unsafe image/link URLs', () => {
  const s = snapshot()
  s.flyers = [
    { id: 'a', title: 'Envíos', image: '/flyers/envios-market-mutual.png' },
  ]
  for (const flyers of [
    [s.flyers[0], s.flyers[0]],
    [{ ...s.flyers[0], title: '' }],
    [{ ...s.flyers[0], image: 'https://example.com/image.png' }],
    [{ ...s.flyers[0], href: 'javascript:alert(1)' }],
  ])
    assert.throws(() => applyCatalogCommand(s, { type: 'flyers', flyers }, ''))
})
