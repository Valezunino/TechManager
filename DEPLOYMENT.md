# Publicar TechManager

TechManager se despliega en tres partes:

1. **Frontend:** Vercel.
2. **Backend:** un servicio compatible con Docker y Java 21.
3. **Base de datos:** PostgreSQL administrado.

## Variables del backend

Iniciar el backend con el perfil `prod` y configurar:

| Variable | Descripción |
| --- | --- |
| `SPRING_PROFILES_ACTIVE` | Debe valer `prod`. |
| `DB_URL` | URL JDBC completa, por ejemplo `jdbc:postgresql://host:5432/techmanager`. |
| `DB_USERNAME` | Usuario de PostgreSQL. |
| `DB_PASSWORD` | Contraseña de PostgreSQL. |
| `JWT_SECRET` | Secreto aleatorio en Base64 de 32 bytes o más. |
| `APP_CORS_ALLOWED_ORIGIN_PATTERNS` | Dominio permitido, por ejemplo `https://techmanager.vercel.app`. |

El `Dockerfile` de la raíz compila y ejecuta Spring Boot con Java 21.

## Variable de Vercel

Dentro del proyecto del frontend crear:

| Variable | Descripción |
| --- | --- |
| `BACKEND_URL` | URL pública HTTPS del backend, sin barra final. |

En Vercel debe seleccionarse `frontend` como directorio raíz del proyecto.

## Primer ingreso

Cuando la base de datos está vacía, la página muestra automáticamente el formulario para crear el primer administrador. Después de crearlo, el registro inicial queda cerrado y solo un administrador autenticado puede gestionar usuarios.

