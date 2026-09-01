# Instrucciones Git para Mateo

El ZIP no contiene la carpeta oculta `.git` ni credenciales. Para conservar el historial correcto del repositorio, trabajá así:

```bash
git clone https://github.com/Valezunino/TechManager.git TechManager-Mateo-Git
cd TechManager-Mateo-Git
git switch master
git pull origin master
git switch -c feature/mateo-productos-marcas
```

Usá el código del ZIP como copia ejecutable y guía. Realizá en la carpeta clonada solamente los cambios de tu módulo indicados en `LEEME_PRIMERO.md`.

Para guardar trabajo real:

```bash
git status
git add ruta/del/archivo-que-modificaste
git commit -m "Implementar productos y marcas"
git push -u origin feature/mateo-productos-marcas
```

Luego abrí en GitHub un Pull Request desde `feature/mateo-productos-marcas` hacia `master`.

No uses `git add .` sin mirar antes `git status`, y nunca subas `.env`, `DATABASE_URL`, `JWT_SECRET` ni contraseñas.
