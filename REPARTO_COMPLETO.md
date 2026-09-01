# Reparto completo de TechManager

Cada ZIP contiene el proyecto entero porque una branch de Git necesita todos los archivos para poder instalarse, ejecutarse y probarse. La división está en la responsabilidad sobre los módulos y funciones; no deben borrar los módulos de los demás.

| Integrante | Branch | Frontend | Backend y datos |
|---|---|---|---|
| Alexis | `feature/alexis-auth-categorias` | Registro inicial, login, sesión, conexión y categorías | Auth, JWT, seguridad y categorías |
| Mateo | `feature/mateo-productos-marcas` | Productos, búsqueda, precios, stock y marcas | Productos, marcas, validaciones y relaciones |
| Valentín | `feature/valentin-usuarios-dashboard` | Shell, navegación, dashboard, usuarios y roles | Usuarios, roles, métricas, esquema e integración Vercel/Neon |

## Archivos grandes compartidos

- `frontend/app.js`: cada integrante modifica solamente las funciones nombradas en su `LEEME_PRIMERO.md`.
- `frontend/api/[...path].js`: cada integrante modifica solamente sus handlers y helpers asignados.
- `frontend/styles.css`: cada integrante modifica los estilos de sus pantallas; los cambios globales se coordinan con Valentín.
- `src/test/.../TechManagerApplicationTests.java`: queda como prueba base. Cada integrante crea un archivo de prueba de su módulo.

## Reglas para integrar sin perder código

1. Las tres branches nacen de la misma versión de `master`.
2. Nadie formatea o reemplaza completo `app.js`, `styles.css` ni `api/[...path].js`.
3. Cada cambio se guarda en commits chicos con mensajes claros.
4. Primero se abren los tres Pull Requests y se revisan; después se integran de a uno.
5. Tras cada merge se ejecutan las pruebas del frontend y del backend.
6. Si Git marca un conflicto, se conservan ambas funciones y se prueba el flujo completo antes de continuar.

## Orden sugerido de integración

1. Alexis: autenticación y categorías.
2. Mateo: productos y marcas.
3. Valentín: usuarios, dashboard e integración final.

Este orden respeta las dependencias: primero el acceso, luego el catálogo y finalmente la administración e integración.
