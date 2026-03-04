# ============================================================================
# Crear Issues en GitHub — Ejecutar despues de: gh auth login
# Repo: agentic-workshop-naturgy/agentic-workshop-naturgy-group1
# ============================================================================

$repo = "agentic-workshop-naturgy/agentic-workshop-naturgy-group1"

# --- ISSUE 1: Despliegue en la nube ---
gh issue create --repo $repo `
  --title "Deploy: Publicar la aplicacion en internet con URL publica" `
  --label "enhancement,deploy" `
  --body @"
## Descripcion
Desplegar el frontend y el backend en un servicio cloud para que la aplicacion sea accesible desde cualquier navegador a traves de una URL publica.

## Tareas
- [ ] **Backend**: Dockerizar Spring Boot (Dockerfile multi-stage)
- [ ] **Frontend**: Build de produccion (``vite build``) y servir como estatico
- [ ] **Docker Compose**: Orquestar backend + frontend + proxy
- [ ] **Despliegue cloud**: Subir a Azure App Service / AWS ECS / Railway / Render
- [ ] **Dominio**: Configurar dominio/subdominio con HTTPS (Let's Encrypt)
- [ ] **CI/CD**: GitHub Actions para build + deploy automatico en push a main

## Criterios de aceptacion
- La app es accesible en https://<dominio>
- El frontend se comunica con el backend via /api (proxy o CORS configurado)
- HTTPS activo con certificado valido

## Agente recomendado
**GitHub Copilot (modo Agent)** — Puede generar el ``Dockerfile``, ``docker-compose.yml``, workflow de GitHub Actions y configurar variables de entorno.
"@

Write-Host "Issue 1 creada: Deploy"

# --- ISSUE 2: Seguridad - Autenticacion y Autorizacion ---
gh issue create --repo $repo `
  --title "Security: Implementar autenticacion y autorizacion (Spring Security + JWT)" `
  --label "enhancement,security" `
  --body @"
## Descripcion
Proteger la aplicacion con autenticacion basada en JWT. Solo usuarios autenticados pueden acceder a la API y al frontend.

## Tareas Backend (Spring Security)
- [ ] Anadir dependencia ``spring-boot-starter-security`` + ``jjwt``
- [ ] Crear entidad ``Usuario`` (username, password hash, rol)
- [ ] Endpoint ``POST /api/auth/login`` que devuelve JWT
- [ ] Endpoint ``POST /api/auth/register`` para crear usuarios
- [ ] Filtro JWT (``OncePerRequestFilter``) que valida el token en cada peticion
- [ ] ``SecurityFilterChain``: proteger ``/api/**`` excepto ``/api/auth/**``
- [ ] Roles: ``ADMIN`` (CRUD completo) y ``VIEWER`` (solo lectura)
- [ ] Seed de usuario admin por defecto (admin/admin123)

## Tareas Frontend (React)
- [ ] Pantalla de Login con formulario usuario/contrasena
- [ ] Guardar JWT en localStorage/sessionStorage
- [ ] Interceptor en ``httpClient.ts`` que anade header ``Authorization: Bearer <token>``
- [ ] Redirigir a /login si la API devuelve 401
- [ ] Mostrar/ocultar botones segun rol del usuario
- [ ] Boton de Logout en la barra superior

## Criterios de aceptacion
- Sin login no se puede ver ningun dato
- El token expira en 24h
- Las rutas protegidas devuelven 401 sin token valido
- Un usuario VIEWER no puede crear/editar/eliminar

## Agente recomendado
**GitHub Copilot (modo Agent)** — Para generar la configuracion de Spring Security, filtros JWT, entidades y el flujo de login en React.
"@

Write-Host "Issue 2 creada: Security"

# --- ISSUE 3: Dockerizacion ---
gh issue create --repo $repo `
  --title "Infra: Crear Dockerfile y docker-compose para entorno local y produccion" `
  --label "enhancement,infrastructure" `
  --body @"
## Descripcion
Containerizar la aplicacion para facilitar el despliegue y garantizar consistencia entre entornos.

## Tareas
- [ ] ``backend/Dockerfile`` — Multi-stage: Maven build + JRE runtime (Eclipse Temurin 17)
- [ ] ``frontend/Dockerfile`` — Multi-stage: Node build + Nginx para servir estaticos
- [ ] ``nginx.conf`` — Proxy reverso: ``/api`` -> backend:8080, ``/`` -> frontend estatics
- [ ] ``docker-compose.yml`` — Servicios: backend, frontend, (opcional) PostgreSQL
- [ ] ``.dockerignore`` para ambos proyectos
- [ ] Variables de entorno para configuracion (DB URL, JWT secret, etc.)
- [ ] Documentar en README como levantar con ``docker compose up``

## Criterios de aceptacion
- ``docker compose up`` levanta toda la app funcional
- Frontend accesible en puerto 80/443
- Backend no expuesto directamente (solo via proxy)

## Agente recomendado
**GitHub Copilot (modo Agent)** — Genera Dockerfiles optimizados, nginx.conf y docker-compose.yml.
"@

Write-Host "Issue 3 creada: Docker"

# --- ISSUE 4: HTTPS y Dominio ---
gh issue create --repo $repo `
  --title "Infra: Configurar HTTPS con certificado SSL y dominio personalizado" `
  --label "enhancement,infrastructure" `
  --body @"
## Descripcion
Configurar un dominio personalizado con certificado SSL para acceso seguro por HTTPS.

## Tareas
- [ ] Registrar subdominio (ej: gas.naturgy-workshop.dev)
- [ ] Configurar DNS (A record / CNAME) apuntando al servidor
- [ ] Certificado SSL via Let's Encrypt (Certbot o Caddy como proxy)
- [ ] Redireccion HTTP -> HTTPS automatica
- [ ] Headers de seguridad (HSTS, X-Frame-Options, CSP)

## Agente recomendado
**GitHub Copilot (modo Agent)** para generar la config de Caddy/Nginx con SSL. Para la gestion de DNS, hacerlo manualmente en el proveedor de dominio.
"@

Write-Host "Issue 4 creada: HTTPS"

# --- ISSUE 5: CI/CD Pipeline ---
gh issue create --repo $repo `
  --title "CI/CD: Pipeline de GitHub Actions para build, test y deploy automatico" `
  --label "enhancement,ci-cd" `
  --body @"
## Descripcion
Automatizar el ciclo de vida: en cada push a main, compilar, ejecutar tests y desplegar.

## Tareas
- [ ] Workflow ``.github/workflows/ci.yml``:
  - Job 1: Build backend (Maven) + tests unitarios
  - Job 2: Build frontend (Vite) + tests E2E Playwright
  - Job 3: Build imagenes Docker y push a GitHub Container Registry
  - Job 4: Deploy a cloud (Azure/Railway/Render)
- [ ] Secrets en GitHub: ``DOCKER_TOKEN``, ``DEPLOY_URL``, ``JWT_SECRET``
- [ ] Badge de estado en README.md
- [ ] Notificacion Slack/Teams en caso de fallo (opcional)

## Criterios de aceptacion
- Push a main dispara el pipeline completo
- Si los tests fallan, no se despliega
- Las imagenes Docker se versionan con el SHA del commit

## Agente recomendado
**GitHub Copilot (modo Agent)** — Genera workflows de GitHub Actions completos. Para configurar secrets y conexiones cloud, hacerlo manualmente en Settings > Secrets.
"@

Write-Host "Issue 5 creada: CI/CD"

# --- ISSUE 6: Dashboard con KPIs ---
gh issue create --repo $repo `
  --title "Feature: Dashboard con KPIs y graficos de consumo" `
  --label "enhancement,feature" `
  --body @"
## Descripcion
Crear un dashboard visual con metricas clave del negocio y graficos de consumo.

## Tareas
- [ ] Endpoint ``GET /api/gas/dashboard/stats`` con KPIs agregados
- [ ] Cards: Total facturado, Consumo medio, Puntos activos/inactivos, Lecturas ultimo mes
- [ ] Grafico de barras: consumo mensual por punto de suministro (Recharts)
- [ ] Grafico circular: distribucion por zona
- [ ] Responsive: adaptarse a movil y desktop

## Agente recomendado
**GitHub Copilot (modo Agent)** — Para generar componentes React con Recharts y endpoints de agregacion en Spring Boot.
"@

Write-Host "Issue 6 creada: Dashboard"

# --- ISSUE 7: Mapa interactivo ---
gh issue create --repo $repo `
  --title "Feature: Mapa interactivo de puntos de suministro en Barcelona" `
  --label "enhancement,feature" `
  --body @"
## Descripcion
Visualizar los puntos de suministro en un mapa de Barcelona con marcadores interactivos.

## Tareas
- [ ] Instalar ``react-leaflet`` + ``leaflet``
- [ ] Geocodificar las direcciones de los puntos (o usar coords fijas seed)
- [ ] Mapa centrado en Barcelona con marcadores por punto
- [ ] Color del marcador segun estado (verde=ACTIVO, gris=INACTIVO)
- [ ] Popup al hacer click: CUPS, cliente, direccion, consumo
- [ ] Integrar en la pagina ``MapPage.tsx`` existente

## Agente recomendado
**GitHub Copilot (modo Agent)** — Para generar el componente de mapa con react-leaflet y la integracion con la API.
"@

Write-Host "Issue 7 creada: Mapa"

Write-Host ""
Write-Host "=== 7 issues creadas correctamente ==="
