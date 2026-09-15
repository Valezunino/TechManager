import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pg from "pg";

const { Pool } = pg;

let pool;
let schemaReady;

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function database() {
  if (!process.env.DATABASE_URL) {
    throw new HttpError(503, "Falta configurar DATABASE_URL en Vercel");
  }
  if (!pool) {
    const connectionUrl = new URL(process.env.DATABASE_URL);
    connectionUrl.searchParams.set("sslmode", "verify-full");
    pool = new Pool({
      connectionString: connectionUrl.toString(),
      max: 2,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000
    });
  }
  return pool;
}

async function initializeSchema() {
  const client = await database().connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock($1)", [35_040_287]);
    await client.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id BIGSERIAL PRIMARY KEY,
        nombre VARCHAR(50) NOT NULL UNIQUE
      );

      CREATE TABLE IF NOT EXISTS usuarios (
        id BIGSERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        rol_id BIGINT NOT NULL REFERENCES roles(id),
        activo BOOLEAN NOT NULL DEFAULT TRUE
      );

      CREATE TABLE IF NOT EXISTS categorias (
        id BIGSERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL UNIQUE
      );

      CREATE TABLE IF NOT EXISTS marcas (
        id BIGSERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL UNIQUE
      );

      CREATE TABLE IF NOT EXISTS productos (
        id BIGSERIAL PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        descripcion VARCHAR(500),
        precio_compra NUMERIC(10, 2) NOT NULL CHECK (precio_compra >= 0),
        precio_venta NUMERIC(10, 2) NOT NULL CHECK (precio_venta >= 0),
        stock INTEGER NOT NULL CHECK (stock >= 0),
        marca_id BIGINT NOT NULL REFERENCES marcas(id),
        categoria_id BIGINT NOT NULL REFERENCES categorias(id),
        activo BOOLEAN NOT NULL DEFAULT TRUE
      );

      CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria_id);
      CREATE INDEX IF NOT EXISTS idx_productos_marca ON productos(marca_id);
      CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol_id);

      INSERT INTO roles (nombre)
      VALUES ('ADMIN'), ('EMPLEADO')
      ON CONFLICT (nombre) DO NOTHING;
    `);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = initializeSchema().catch(error => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}

function requiredText(value, label, maxLength) {
  const text = String(value ?? "").trim();
  if (!text) throw new HttpError(400, `${label} es obligatorio`);
  if (text.length > maxLength) {
    throw new HttpError(400, `${label} no puede superar ${maxLength} caracteres`);
  }
  return text;
}

function normalizedEmail(value) {
  const email = requiredText(value, "El email", 100).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(400, "El email no es válido");
  }
  return email;
}

function positiveId(value, label = "El identificador") {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new HttpError(400, `${label} no es válido`);
  return id;
}

function bodyOf(request) {
  if (request.body == null || request.body === "") return {};
  if (typeof request.body === "object") return request.body;
  try {
    return JSON.parse(request.body);
  } catch {
    throw new HttpError(400, "El cuerpo de la solicitud no es JSON válido");
  }
}

function jwtSecret() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new HttpError(503, "Falta configurar un JWT_SECRET seguro en Vercel");
  }
  return process.env.JWT_SECRET;
}

function sessionResponse(user) {
  const token = jwt.sign(
    { id: Number(user.id), email: user.email, rol: user.rol },
    jwtSecret(),
    { expiresIn: "24h", issuer: "techmanager" }
  );
  return { token, nombre: user.nombre, email: user.email, rol: user.rol };
}

async function authenticatedUser(request) {
  const authorization = String(request.headers.authorization || "");
  if (!authorization.startsWith("Bearer ")) throw new HttpError(401, "Sesión no válida");

  let payload;
  try {
    payload = jwt.verify(authorization.slice(7), jwtSecret(), { issuer: "techmanager" });
  } catch {
    throw new HttpError(401, "La sesión venció o no es válida");
  }

  const result = await database().query(
    `SELECT u.id::int, u.nombre, u.email, r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON r.id = u.rol_id
      WHERE u.id = $1 AND u.activo = TRUE`,
    [payload.id]
  );
  if (!result.rowCount) throw new HttpError(401, "El usuario no está activo");
  return result.rows[0];
}

function requireAdmin(user) {
  if (user.rol !== "ADMIN") throw new HttpError(403, "Acceso exclusivo para administradores");
}

async function fetchProduct(id) {
  const values = [];
  const where = id ? "WHERE p.id = $1" : "";
  if (id) values.push(id);
  const result = await database().query(
    `SELECT p.id::int,
            p.nombre,
            p.descripcion,
            p.precio_compra AS "precioCompra",
            p.precio_venta AS "precioVenta",
            p.stock,
            p.activo,
            json_build_object('id', c.id::int, 'nombre', c.nombre) AS categoria,
            json_build_object('id', m.id::int, 'nombre', m.nombre) AS marca
       FROM productos p
       JOIN categorias c ON c.id = p.categoria_id
       JOIN marcas m ON m.id = p.marca_id
       ${where}
      ORDER BY p.id DESC`,
    values
  );
  const products = result.rows.map(row => ({
    ...row,
    precioCompra: Number(row.precioCompra),
    precioVenta: Number(row.precioVenta),
    stock: Number(row.stock)
  }));
  if (id && !products.length) throw new HttpError(404, "Producto no encontrado");
  return id ? products[0] : products;
}

function productInput(body) {
  const nombre = requiredText(body.nombre, "El nombre", 150);
  const descripcion = String(body.descripcion ?? "").trim() || null;
  if (descripcion && descripcion.length > 500) {
    throw new HttpError(400, "La descripción no puede superar 500 caracteres");
  }
  const precioCompra = Number(body.precioCompra);
  const precioVenta = Number(body.precioVenta);
  const stock = Number(body.stock);
  if (!Number.isFinite(precioCompra) || precioCompra < 0) {
    throw new HttpError(400, "El precio de compra no puede ser negativo");
  }
  if (!Number.isFinite(precioVenta) || precioVenta < 0) {
    throw new HttpError(400, "El precio de venta no puede ser negativo");
  }
  if (!Number.isInteger(stock) || stock < 0) {
    throw new HttpError(400, "El stock debe ser un número entero no negativo");
  }
  return {
    nombre,
    descripcion,
    precioCompra,
    precioVenta,
    stock,
    categoriaId: positiveId(body.categoria?.id ?? body.categoriaId, "La categoría"),
    marcaId: positiveId(body.marca?.id ?? body.marcaId, "La marca"),
    activo: body.activo !== false
  };
}

async function handleAuth(path, method, request, response) {
  const db = database();
  if (path === "/auth/bootstrap-status" && method === "GET") {
    const result = await db.query("SELECT COUNT(*)::int AS total FROM usuarios");
    return response.status(200).json({ requiereAdministrador: result.rows[0].total === 0 });
  }

  if (path === "/auth/bootstrap" && method === "POST") {
    const body = bodyOf(request);
    const nombre = requiredText(body.nombre, "El nombre", 100);
    const email = normalizedEmail(body.email);
    const password = String(body.password ?? "");
    if (password.length < 8) throw new HttpError(400, "La contraseña debe tener al menos 8 caracteres");

    const client = await db.connect();
    try {
      await client.query("BEGIN");
      const count = await client.query("SELECT COUNT(*)::int AS total FROM usuarios");
      if (count.rows[0].total > 0) throw new HttpError(409, "El administrador inicial ya fue creado");
      const role = await client.query("SELECT id FROM roles WHERE nombre = 'ADMIN'");
      const passwordHash = await bcrypt.hash(password, 12);
      const inserted = await client.query(
        `INSERT INTO usuarios (nombre, email, password, rol_id, activo)
         VALUES ($1, $2, $3, $4, TRUE)
         RETURNING id::int, nombre, email`,
        [nombre, email, passwordHash, role.rows[0].id]
      );
      await client.query("COMMIT");
      return response.status(200).json(sessionResponse({ ...inserted.rows[0], rol: "ADMIN" }));
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  if (path === "/auth/login" && method === "POST") {
    const body = bodyOf(request);
    const email = normalizedEmail(body.email);
    const password = String(body.password ?? "");
    if (!password) throw new HttpError(400, "La contraseña es obligatoria");
    const result = await db.query(
      `SELECT u.id::int, u.nombre, u.email, u.password, u.activo, r.nombre AS rol
         FROM usuarios u
         JOIN roles r ON r.id = u.rol_id
        WHERE LOWER(u.email) = LOWER($1)`,
      [email]
    );
    const user = result.rows[0];
    if (!user || !user.activo || !(await bcrypt.compare(password, user.password))) {
      throw new HttpError(401, "Email o contraseña incorrectos");
    }
    return response.status(200).json(sessionResponse(user));
  }

  throw new HttpError(404, "Endpoint no encontrado");
}

async function handleSimpleEntity(entity, id, method, request, response) {
  const db = database();
  const singular = entity === "categorias" ? "Categoría" : "Marca";
  if (method === "GET") {
    const result = await db.query(
      `SELECT id::int, nombre FROM ${entity} ${id ? "WHERE id = $1" : ""} ORDER BY nombre`,
      id ? [id] : []
    );
    if (id && !result.rowCount) throw new HttpError(404, `${singular} no encontrada`);
    return response.status(200).json(id ? result.rows[0] : result.rows);
  }

  if (method === "POST" || method === "PUT") {
    const nombre = requiredText(bodyOf(request).nombre, "El nombre", 100);
    const result = method === "POST"
      ? await db.query(`INSERT INTO ${entity} (nombre) VALUES ($1) RETURNING id::int, nombre`, [nombre])
      : await db.query(`UPDATE ${entity} SET nombre = $1 WHERE id = $2 RETURNING id::int, nombre`, [nombre, id]);
    if (!result.rowCount) throw new HttpError(404, `${singular} no encontrada`);
    return response.status(200).json(result.rows[0]);
  }

  if (method === "DELETE") {
    const result = await db.query(`DELETE FROM ${entity} WHERE id = $1`, [id]);
    if (!result.rowCount) throw new HttpError(404, `${singular} no encontrada`);
    return response.status(204).end();
  }
  throw new HttpError(405, "Método no permitido");
}

async function handleProducts(id, method, request, response) {
  const db = database();
  if (method === "GET") return response.status(200).json(await fetchProduct(id));

  if (method === "POST" || method === "PUT") {
    const input = productInput(bodyOf(request));
    let result;
    if (method === "POST") {
      result = await db.query(
        `INSERT INTO productos
          (nombre, descripcion, precio_compra, precio_venta, stock, categoria_id, marca_id, activo)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id::int`,
        [input.nombre, input.descripcion, input.precioCompra, input.precioVenta, input.stock, input.categoriaId, input.marcaId, input.activo]
      );
    } else {
      result = await db.query(
        `UPDATE productos
            SET nombre = $1, descripcion = $2, precio_compra = $3, precio_venta = $4,
                stock = $5, categoria_id = $6, marca_id = $7, activo = $8
          WHERE id = $9
          RETURNING id::int`,
        [input.nombre, input.descripcion, input.precioCompra, input.precioVenta, input.stock, input.categoriaId, input.marcaId, input.activo, id]
      );
    }
    if (!result.rowCount) throw new HttpError(404, "Producto no encontrado");
    return response.status(200).json(await fetchProduct(result.rows[0].id));
  }

  if (method === "DELETE") {
    const result = await db.query("DELETE FROM productos WHERE id = $1", [id]);
    if (!result.rowCount) throw new HttpError(404, "Producto no encontrado");
    return response.status(204).end();
  }
  throw new HttpError(405, "Método no permitido");
}

async function fetchUser(id) {
  const result = await database().query(
    `SELECT u.id::int, u.nombre, u.email, u.activo,
            json_build_object('id', r.id::int, 'nombre', r.nombre) AS rol
       FROM usuarios u
       JOIN roles r ON r.id = u.rol_id
       ${id ? "WHERE u.id = $1" : ""}
      ORDER BY u.nombre`,
    id ? [id] : []
  );
  if (id && !result.rowCount) throw new HttpError(404, "Usuario no encontrado");
  return id ? result.rows[0] : result.rows;
}

async function handleUsers(id, method, request, response, currentUser) {
  const db = database();
  if (method === "GET") return response.status(200).json(await fetchUser(id));

  if (method === "POST" || method === "PUT") {
    const body = bodyOf(request);
    const nombre = requiredText(body.nombre, "El nombre", 100);
    const email = normalizedEmail(body.email);
    const roleId = positiveId(body.rol?.id ?? body.rolId, "El rol");
    const activo = body.activo !== false;
    const role = await db.query("SELECT id, nombre FROM roles WHERE id = $1", [roleId]);
    if (!role.rowCount) throw new HttpError(400, "El rol no existe");
    if (method === "PUT" && id === currentUser.id && (!activo || role.rows[0].nombre !== "ADMIN")) {
      throw new HttpError(409, "No podés quitar tu propio acceso de administrador");
    }

    let result;
    if (method === "POST") {
      const password = String(body.password ?? "");
      if (password.length < 8) throw new HttpError(400, "La contraseña debe tener al menos 8 caracteres");
      result = await db.query(
        `INSERT INTO usuarios (nombre, email, password, rol_id, activo)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id::int`,
        [nombre, email, await bcrypt.hash(password, 12), roleId, activo]
      );
    } else {
      const password = String(body.password ?? "");
      if (password && password.length < 8) throw new HttpError(400, "La contraseña debe tener al menos 8 caracteres");
      result = password
        ? await db.query(
          `UPDATE usuarios SET nombre=$1, email=$2, password=$3, rol_id=$4, activo=$5
            WHERE id=$6 RETURNING id::int`,
          [nombre, email, await bcrypt.hash(password, 12), roleId, activo, id]
        )
        : await db.query(
          `UPDATE usuarios SET nombre=$1, email=$2, rol_id=$3, activo=$4
            WHERE id=$5 RETURNING id::int`,
          [nombre, email, roleId, activo, id]
        );
    }
    if (!result.rowCount) throw new HttpError(404, "Usuario no encontrado");
    return response.status(200).json(await fetchUser(result.rows[0].id));
  }

  if (method === "DELETE") {
    if (id === currentUser.id) throw new HttpError(409, "No podés eliminar tu propia cuenta");
    const target = await db.query(
      `SELECT r.nombre AS rol FROM usuarios u JOIN roles r ON r.id=u.rol_id WHERE u.id=$1`,
      [id]
    );
    if (!target.rowCount) throw new HttpError(404, "Usuario no encontrado");
    if (target.rows[0].rol === "ADMIN") {
      const admins = await db.query(
        `SELECT COUNT(*)::int AS total FROM usuarios u JOIN roles r ON r.id=u.rol_id
          WHERE r.nombre='ADMIN' AND u.activo=TRUE`
      );
      if (admins.rows[0].total <= 1) throw new HttpError(409, "Debe existir al menos un administrador activo");
    }
    await db.query("DELETE FROM usuarios WHERE id=$1", [id]);
    return response.status(204).end();
  }
  throw new HttpError(405, "Método no permitido");
}

async function handleProtected(path, method, request, response, user) {
  if (path === "/dashboard" && method === "GET") {
    const result = await database().query(`
      SELECT (SELECT COUNT(*) FROM productos)::int AS productos,
             (SELECT COUNT(*) FROM categorias)::int AS categorias,
             (SELECT COUNT(*) FROM marcas)::int AS marcas,
             (SELECT COUNT(*) FROM usuarios)::int AS usuarios,
             (SELECT COUNT(*) FROM productos WHERE stock <= 0)::int AS "productosSinStock"
    `);
    return response.status(200).json(result.rows[0]);
  }

  const match = path.match(/^\/(productos|categorias|marcas|usuarios|roles)(?:\/(\d+))?$/);
  if (!match) throw new HttpError(404, "Endpoint no encontrado");
  const [, entity, idText] = match;
  const id = idText ? positiveId(idText) : null;
  if (["POST", "PUT", "DELETE"].includes(method) && method !== "POST" && !id) {
    throw new HttpError(400, "Falta indicar el identificador");
  }

  if (entity === "roles") {
    requireAdmin(user);
    if (method !== "GET" || id) throw new HttpError(405, "Método no permitido");
    const roles = await database().query("SELECT id::int, nombre FROM roles ORDER BY id");
    return response.status(200).json(roles.rows);
  }
  if (entity === "usuarios") {
    requireAdmin(user);
    return handleUsers(id, method, request, response, user);
  }
  if (entity === "productos") return handleProducts(id, method, request, response);
  return handleSimpleEntity(entity, id, method, request, response);
}

function requestPath(request) {
  const raw = Array.isArray(request.query.path)
    ? request.query.path
    : [request.query.path].filter(Boolean);
  return `/${raw.flatMap(part => String(part).split("/")).filter(Boolean).join("/")}`;
}

export default async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, Accept");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.setHeader("Cache-Control", "no-store");
  if (request.method === "OPTIONS") return response.status(204).end();

  try {
    await ensureSchema();
    const path = requestPath(request);
    const method = String(request.method || "GET").toUpperCase();
    if (path.startsWith("/auth/")) return await handleAuth(path, method, request, response);
    const user = await authenticatedUser(request);
    return await handleProtected(path, method, request, response, user);
  } catch (error) {
    if (error instanceof HttpError) {
      return response.status(error.status).json({ message: error.message });
    }
    if (error?.code === "23505") {
      return response.status(409).json({ message: "Ya existe un registro con esos datos" });
    }
    if (error?.code === "23503") {
      return response.status(409).json({ message: "No se puede eliminar porque el registro está en uso" });
    }
    console.error("TechManager API error", error);
    return response.status(500).json({ message: "Ocurrió un error interno en TechManager" });
  }
}

