# Guía de deploy automático — Hutrit Dashboard

Cada vez que hagas `git push` a `main`, el dashboard se publica solo en Vercel.

---

## Configuración inicial (solo una vez)

### Paso 1 — Subir el proyecto a GitHub

```bash
# Desde la carpeta hutrit-dashboard
git init
git add .
git commit -m "feat: Hutrit Dashboard v1 — identidad completa"

# Crear repo en GitHub (necesitas tener gh CLI instalado)
gh repo create hutrit-dashboard --private --push --source=.

# Si no tienes gh CLI, ve a github.com, crea el repo manualmente y luego:
git remote add origin https://github.com/TU_USUARIO/hutrit-dashboard.git
git push -u origin main
```

### Paso 2 — Conectar Vercel al repo

1. Ve a [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Selecciona `hutrit-dashboard`
4. Configuración automática detectada:
   - Framework: **Vite**
   - Build command: `npm run build`
   - Output directory: `dist`
5. Click **"Deploy"**
6. Vercel te dará una URL tipo `hutrit-dashboard.vercel.app`

### Paso 3 — Obtener los tokens de Vercel para GitHub Actions

**Token de Vercel:**
1. Ve a [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Click **"Create Token"** → nombre: `github-actions`
3. Copia el token

**Org ID y Project ID:**
```bash
# Instala vercel CLI si no lo tienes
npm i -g vercel

# Linkea el proyecto (hazlo desde la carpeta hutrit-dashboard)
vercel link

# Esto crea .vercel/project.json con orgId y projectId
cat .vercel/project.json
```

### Paso 4 — Añadir secrets en GitHub

Ve a tu repo en GitHub → **Settings → Secrets → Actions** → "New repository secret":

| Nombre              | Valor                          |
|---------------------|--------------------------------|
| `VERCEL_TOKEN`      | El token que copiaste          |
| `VERCEL_ORG_ID`     | El `orgId` de project.json     |
| `VERCEL_PROJECT_ID` | El `projectId` de project.json |

---

## Uso diario (una vez configurado)

```bash
# Hacer un cambio (ej: actualizar colores)
# Editar src/index.css o cualquier archivo...

git add .
git commit -m "fix: actualizar color acento"
git push
```

→ GitHub Actions detecta el push  
→ Hace build automático  
→ Publica en Vercel en ~60 segundos  
→ Tu URL live se actualiza sola  

---

## URLs

- **Producción:** `https://hutrit-dashboard.vercel.app` (o tu dominio custom)
- **PRs:** Vercel crea una URL preview única por cada Pull Request
- **Historial:** En Vercel puedes hacer rollback a cualquier deploy anterior

---

## Dominio personalizado (opcional)

En Vercel → tu proyecto → **Settings → Domains**:
- Añade `dashboard.hutrit.com` o `app.hutrit.club`
- Vercel te da los DNS records para configurar en tu registrador

---

## Cambiar colores cuando tengas la marca definitiva

Solo edita `src/index.css`, líneas 5-6:
```css
--h-primary: #0D5C54;   ← color sidebar y textos principales
--h-accent:  #0D9488;   ← color botones y highlights
```

Luego `git push` y en 60 segundos está live.
