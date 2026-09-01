# TechManager — parte de Mateo

## Tu branch

`feature/mateo-productos-marcas`

## Tu módulo completo

Te corresponde **productos, inventario, precios, stock y marcas**. Esta parte incluye frontend, backend Spring Boot, API serverless de Vercel, persistencia y pruebas.

### Frontend

- Listado y búsqueda de productos.
- Alta, edición y eliminación de productos.
- Precios de compra y venta, stock, estado, categoría y marca.
- Indicadores visuales de stock bajo o sin stock.
- Listado, alta, edición y eliminación de marcas.
- Formularios, validaciones y mensajes de error de estos flujos.

Archivos y funciones principales:

- `frontend/app.js`: `money`, `ensureCatalogs`, `renderProducts`, `renderProductsTable`, `prepareProductModal` y `openProductModal`.
- `frontend/app.js`: la rama de **marcas** dentro de `renderSimpleEntities`, `openSimpleEntityModal`, `handleModalSubmit` y `deleteRecord`.
- `frontend/styles.css`: estilos usados por inventario, tablas, stock y pantalla de marcas.

### Backend Spring Boot

- `controller/MarcaController.java`
- `controller/ProductoController.java`
- `entity/BaseEntity.java`
- `entity/Marca.java`
- `entity/Producto.java`
- `exception/GlobalExceptionHandler.java`
- `repository/MarcaRepository.java`
- `repository/ProductoRepository.java`
- `service/MarcaService.java`
- `service/ProductoService.java`
- `service/impl/MarcaServiceImpl.java`
- `service/impl/ProductoServiceImpl.java`

### Backend activo en Vercel

En `frontend/api/[...path].js` te corresponden:

- `fetchProduct` y `productInput`.
- `handleProducts` completo.
- El comportamiento de `handleSimpleEntity` cuando la entidad es `marcas`.
- La validación de precio, stock, estado, categoría y marca.
- Los errores de integridad cuando una marca está siendo usada por un producto.

No copies estas funciones a otro archivo sin coordinarlo: la API de Vercel está centralizada y Git puede unir cambios en funciones diferentes si cada integrante modifica sólo su sector.

### Base de datos

- Tablas `productos` y `marcas`.
- Relaciones del producto con categoría y marca.
- Índices, precios no negativos, stock entero no negativo y estado activo.

### Pruebas que tenés que presentar

1. Crear, listar, editar y eliminar una marca.
2. Crear un producto relacionado con una categoría y una marca.
3. Buscar/listar productos y verificar los datos relacionados.
4. Editar precios, stock y estado de un producto.
5. Rechazar precio negativo, stock negativo o IDs inexistentes.
6. Verificar que no se pueda eliminar una marca usada por un producto.

Podés crear `src/test/java/com/techmanager/techmanager/ProductoMarcaIntegrationTest.java` para que tus pruebas queden identificadas.

## Antes de entregar

- Ejecutá `cd frontend && npm install && npm run check`.
- Desde la raíz ejecutá `./mvnw test` (en Windows: `mvnw.cmd test`).
- Probá tu módulo en el navegador.
- Hacé commits únicamente por cambios que realmente hayas revisado o realizado.
- Subí la branch indicada y abrí un Pull Request hacia `master`; no hagas el merge hasta que las tres partes estén revisadas.

Leé también `REPARTO_COMPLETO.md` e `INSTRUCCIONES_GIT.md`.
