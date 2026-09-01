# TechManager Frontend

Panel web sin dependencias externas para administrar el backend Spring Boot de TechManager.

## Funciones incluidas

- Inicio de sesión con JWT.
- Creación segura del primer administrador.
- Dashboard con estadísticas reales.
- CRUD de productos, categorías y marcas.
- Control visual de stock bajo y productos sin stock.
- Administración de usuarios y roles para cuentas ADMIN.
- Diseño responsive para computadora, tablet y celular.
- Proxy de API para Vercel, evitando exponer la dirección del backend en el navegador.

## Desarrollo local

1. Iniciar Spring Boot en `http://localhost:8080`.
2. Desde esta carpeta ejecutar un servidor estático, por ejemplo:

   ```bash
   python3 -m http.server 3000
   ```

3. Abrir `http://localhost:3000`.

El frontend detecta el entorno local y se conecta automáticamente a `http://localhost:8080`.

## Publicación en Vercel

1. Importar el repositorio de GitHub en Vercel.
2. Elegir `frontend` como **Root Directory**.
3. Dejar vacíos el comando de build y el directorio de salida.
4. Crear la variable de entorno `BACKEND_URL` con la URL pública del backend, sin una barra al final.
5. Publicar el proyecto.

La página publicada utiliza `/api` y la función incluida en `api/[...path].js` reenvía las solicitudes al backend.

