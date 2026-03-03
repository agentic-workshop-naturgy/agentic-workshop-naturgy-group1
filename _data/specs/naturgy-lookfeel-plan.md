# Plan de Mejora Look & Feel - Estilo Naturgy
**Fecha:** 2026-03-03  
**Objetivo:** Aplicar identidad visual corporativa de Naturgy a la aplicación web y facturas PDF

---

## 1. ANÁLISIS DE IDENTIDAD VISUAL NATURGY (www.naturgy.es)

### 1.1. Paleta de Colores Corporativa
Basado en la identidad visual de Naturgy, debemos verificar y aplicar:

**Colores Primarios:**
- **Verde Naturgy** (Primary): `#00A03E` / `#00B140` (color corporativo principal)
- **Azul Oscuro** (Secondary): `#003B5C` / `#004474` (confianza, estabilidad)
- **Blanco**: `#FFFFFF` (limpieza, backgrounds)

**Colores Secundarios/Acentos:**
- **Gris Oscuro**: `#333333` / `#4A4A4A` (textos)
- **Gris Medio**: `#767676` / `#999999` (textos secundarios)
- **Gris Claro**: `#E5E5E5` / `#F5F5F5` / `#FAFAFA` (fondos)
- **Verde Claro**: `#E6F4EC` (fondos de secciones verdes)
- **Azul Claro**: `#E8F4F8` (fondos de secciones informativas)

**Colores de Estado:**
- **Success**: `#00A03E` (verde Naturgy)
- **Error**: `#D32F2F` (rojo)
- **Warning**: `#FFA726` (naranja)
- **Info**: `#0288D1` (azul info)

**NOTA:** Los colores actuales en el theme (`#F5831F` naranja y `#1a2744` azul oscuro) NO corresponden a Naturgy. Necesitan ser reemplazados.

### 1.2. Tipografía
Según el sitio web de Naturgy:

**Fuente Primaria:**
- **Naturgy Custom Font** (si disponible) o
- **Open Sans** (alternativa común en web corporativa)
- **Roboto** (fallback compatible MUI)

**Jerarquía Tipográfica:**
- Títulos H1: 32-40px, Bold (700)
- Títulos H2: 24-28px, SemiBold (600)
- Títulos H3/H4: 18-20px, SemiBold (600)
- Body: 14-16px, Regular (400)
- Small: 12-14px, Regular (400)
- Captions: 11-12px, Regular (400)

### 1.3. Logo
**Logo Naturgy:**
- Debe incluirse en header/sidebar de la aplicación
- Debe aparecer en el encabezado de las facturas PDF
- Formato: SVG o PNG de alta resolución
- Ubicación típica: Top-left del header

**Ubicaciones necesarias:**
- `frontend/public/logo-naturgy.svg` (o .png)
- `backend/src/main/resources/logo-naturgy.png` (para PDF)

### 1.4. Elementos Visuales
- **Bordes redondeados**: 4-8px (suaves, modernos)
- **Sombras sutiles**: elevation bajo (1-2)
- **Espaciado**: Grid de 8px (8, 16, 24, 32, 40, 48)
- **Iconografía**: Material Icons (coherente con MUI)

---

## 2. MEJORAS PARA LA APLICACIÓN WEB

### 2.1. Theme (frontend/src/app/theme.ts)

**CAMBIOS OBLIGATORIOS:**

```typescript
palette: {
  primary: {
    main: '#00A03E',        // Verde Naturgy (actualmente #F5831F)
    light: '#33B969',       // Verde más claro
    dark: '#007A30',        // Verde oscuro
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#003B5C',        // Azul Naturgy (actualmente #1a2744)
    light: '#336B88',
    dark: '#002840',
    contrastText: '#ffffff',
  },
  background: {
    default: '#F5F5F5',     // Gris claro (actualmente #FFF8F2)
    paper: '#FFFFFF',
  },
  text: {
    primary: '#333333',
    secondary: '#767676',
  },
  success: {
    main: '#00A03E',        // Verde Naturgy
  },
  error: {
    main: '#D32F2F',
  },
  warning: {
    main: '#FFA726',
  },
  info: {
    main: '#0288D1',
  },
},
typography: {
  fontFamily: '"Open Sans", "Roboto", "Helvetica", "Arial", sans-serif',
  h1: { fontSize: '2.5rem', fontWeight: 700 },
  h2: { fontSize: '2rem', fontWeight: 600 },
  h3: { fontSize: '1.75rem', fontWeight: 600 },
  h4: { fontSize: '1.5rem', fontWeight: 600 },
  h5: { fontSize: '1.25rem', fontWeight: 600 },
  h6: { fontSize: '1.125rem', fontWeight: 600 },
  body1: { fontSize: '1rem', lineHeight: 1.6 },
  body2: { fontSize: '0.875rem', lineHeight: 1.6 },
},
shape: {
  borderRadius: 6,          // Suavizado (actualmente 8)
},
```

**Agregar fuente Open Sans en index.html:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700&display=swap" rel="stylesheet">
```

### 2.2. Header/AppBar (App.tsx)

**Agregar logo Naturgy:**
- Posición: Izquierda del título
- Altura: 36-40px
- Fondo: Verde Naturgy (`#00A03E`) o azul oscuro

```tsx
<AppBar
  position="fixed"
  sx={{ 
    width: `calc(100% - ${DRAWER_WIDTH}px)`, 
    ml: `${DRAWER_WIDTH}px`,
    bgcolor: 'primary.main',  // Verde Naturgy
  }}
>
  <Toolbar>
    <Box component="img" src="/logo-naturgy.svg" alt="Naturgy" sx={{ height: 36, mr: 2 }} />
    <Typography variant="h6" noWrap sx={{ fontWeight: 600 }}>
      {PAGE_TITLES[currentPage]}
    </Typography>
    {/* ... */}
  </Toolbar>
</AppBar>
```

### 2.3. Sidebar/Drawer (App.tsx)

**Estilo corporativo:**
```tsx
<Drawer
  variant="permanent"
  sx={{
    width: DRAWER_WIDTH,
    '& .MuiDrawer-paper': {
      width: DRAWER_WIDTH,
      bgcolor: '#003B5C',      // Azul Naturgy
      color: '#FFFFFF',
      borderRight: 'none',
    },
  }}
>
  <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
    <Box component="img" src="/logo-naturgy.svg" alt="Naturgy" sx={{ height: 32 }} />
    <Typography variant="h6" sx={{ fontWeight: 700, color: '#FFFFFF' }}>
      GAS
    </Typography>
  </Box>
  <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />
  {/* nav items con hover verde */}
</Drawer>
```

**Nav items hover effect:**
```tsx
<ListItemButton
  sx={{
    '&:hover': { bgcolor: 'rgba(0, 160, 62, 0.15)' },
    '&.Mui-selected': {
      bgcolor: 'rgba(0, 160, 62, 0.25)',
      borderLeft: '4px solid #00A03E',
    },
  }}
>
```

### 2.4. Botones (global)

**Primary buttons:**
- Background: Verde Naturgy (`#00A03E`)
- Hover: Verde oscuro (`#007A30`)
- Border radius: 6px
- Text transform: ninguno (mantener capitalización natural)

**Secondary buttons:**
- Outline: Azul Naturgy (`#003B5C`)

```tsx
MuiButton: {
  defaultProps: { 
    disableElevation: true,
  },
  styleOverrides: {
    root: {
      textTransform: 'none',
      fontWeight: 600,
      borderRadius: 6,
    },
  },
},
```

### 2.5. Cards y Containers

**Elevación sutil:**
```tsx
MuiPaper: {
  styleOverrides: {
    elevation1: {
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    },
  },
},
```

### 2.6. DataGrid

**Estilo consistente:**
```tsx
MuiDataGrid: {
  styleOverrides: {
    root: {
      border: 'none',
      '& .MuiDataGrid-columnHeaders': {
        bgcolor: '#F5F5F5',
        color: '#333333',
        fontWeight: 600,
      },
      '& .MuiDataGrid-row:hover': {
        bgcolor: '#E6F4EC',  // Verde claro Naturgy
      },
    },
  },
},
```

### 2.7. Chips de Estado

**SupplyPoints estado:**
```tsx
<Chip
  label={params.row.estado}
  color={params.row.estado === 'ACTIVO' ? 'success' : 'default'}
  size="small"
  sx={{
    fontWeight: 600,
    bgcolor: params.row.estado === 'ACTIVO' ? '#E6F4EC' : '#E5E5E5',
    color: params.row.estado === 'ACTIVO' ? '#007A30' : '#767676',
  }}
/>
```

---

## 3. MEJORAS PARA FACTURA PDF

### 3.1. Estructura Visual Mejorada

**Encabezado (Header):**
```
┌─────────────────────────────────────────────────────────┐
│ [LOGO NATURGY]          FACTURA DE GAS NATURAL          │
│                    Nº: GAS-202601-ES0021...001          │
│                    Fecha emisión: 01/02/2026            │
└─────────────────────────────────────────────────────────┘
```

**Layout de la factura:**
1. **Header con logo** (fondo verde/azul)
2. **Datos del cliente** (izquierda)
3. **Datos del contrato** (derecha)
4. **Periodo de facturación** (destacado)
5. **Detalle de consumo** (tabla con bordes)
6. **Desglose de importes** (tabla estructurada)
7. **Total a pagar** (destacado en verde)
8. **Footer** (información legal y contacto)

### 3.2. Colores en PDF (PdfService.java)

**Agregar constantes de color RGB:**
```java
// Colores Naturgy
private static final float[] COLOR_VERDE_NATURGY = {0f, 0.627f, 0.243f}; // #00A03E
private static final float[] COLOR_AZUL_NATURGY = {0f, 0.231f, 0.361f};  // #003B5C
private static final float[] COLOR_GRIS_OSCURO = {0.2f, 0.2f, 0.2f};     // #333333
private static final float[] COLOR_GRIS_MEDIO = {0.463f, 0.463f, 0.463f}; // #767676
private static final float[] COLOR_GRIS_CLARO = {0.898f, 0.898f, 0.898f};  // #E5E5E5
private static final float[] COLOR_VERDE_CLARO = {0.902f, 0.957f, 0.925f}; // #E6F4EC
```

### 3.3. Header con Logo y Banda de Color

**Implementación:**
```java
// Header con fondo verde
cs.setNonStrokingColor(COLOR_VERDE_NATURGY[0], COLOR_VERDE_NATURGY[1], COLOR_VERDE_NATURGY[2]);
cs.addRect(0, pageHeight - 80, pageWidth, 80);
cs.fill();

// Logo (si disponible)
// PDImageXObject image = PDImageXObject.createFromFile("logo-naturgy.png", doc);
// cs.drawImage(image, MARGIN, pageHeight - 70, 100, 40);

// Título en blanco sobre verde
cs.setNonStrokingColor(1f, 1f, 1f); // Blanco
y = writeLine(cs, PDType1Font.HELVETICA_BOLD, 18, MARGIN + 110, pageHeight - 45, 
    "FACTURA DE GAS NATURAL");
```

### 3.4. Tablas con Bordes y Fondos

**Tabla de detalle de consumo:**
```java
// Fondo gris claro para header
cs.setNonStrokingColor(COLOR_GRIS_CLARO[0], COLOR_GRIS_CLARO[1], COLOR_GRIS_CLARO[2]);
cs.addRect(MARGIN, y - 18, pageWidth - 2*MARGIN, 20);
cs.fill();

// Texto header en negritas
cs.setNonStrokingColor(COLOR_GRIS_OSCURO[0], COLOR_GRIS_OSCURO[1], COLOR_GRIS_OSCURO[2]);
// Headers: Concepto | Cantidad | Precio Unit. | Importe

// Líneas divisorias
cs.setStrokingColor(COLOR_GRIS_MEDIO[0], COLOR_GRIS_MEDIO[1], COLOR_GRIS_MEDIO[2]);
cs.setLineWidth(0.5f);
// Dibujar líneas horizontales y verticales
```

### 3.5. Total Destacado

**Box verde con total:**
```java
// Rectángulo verde claro
cs.setNonStrokingColor(COLOR_VERDE_CLARO[0], COLOR_VERDE_CLARO[1], COLOR_VERDE_CLARO[2]);
cs.addRect(pageWidth - MARGIN - 200, y - 50, 200, 45);
cs.fill();

// Borde verde oscuro
cs.setStrokingColor(COLOR_VERDE_NATURGY[0], COLOR_VERDE_NATURGY[1], COLOR_VERDE_NATURGY[2]);
cs.setLineWidth(2f);
cs.addRect(pageWidth - MARGIN - 200, y - 50, 200, 45);
cs.stroke();

// Texto "TOTAL A PAGAR" en verde oscuro
cs.setNonStrokingColor(COLOR_AZUL_NATURGY[0], COLOR_AZUL_NATURGY[1], COLOR_AZUL_NATURGY[2]);
writeLine(cs, PDType1Font.HELVETICA_BOLD, 10, pageWidth - MARGIN - 180, y - 20, "TOTAL A PAGAR");

// Importe grande en verde Naturgy
cs.setNonStrokingColor(COLOR_VERDE_NATURGY[0], COLOR_VERDE_NATURGY[1], COLOR_VERDE_NATURGY[2]);
writeLine(cs, PDType1Font.HELVETICA_BOLD, 18, pageWidth - MARGIN - 180, y - 40, 
    String.format("%.2f EUR", invoice.getTotal()));
```

### 3.6. Footer Corporativo

```java
// Línea separadora
cs.setStrokingColor(COLOR_GRIS_CLARO[0], COLOR_GRIS_CLARO[1], COLOR_GRIS_CLARO[2]);
cs.setLineWidth(1f);
cs.moveTo(MARGIN, 80);
cs.lineTo(pageWidth - MARGIN, 80);
cs.stroke();

// Info contacto (centrado)
cs.setNonStrokingColor(COLOR_GRIS_MEDIO[0], COLOR_GRIS_MEDIO[1], COLOR_GRIS_MEDIO[2]);
writeLine(cs, PDType1Font.HELVETICA, 8, MARGIN, 60, 
    "Naturgy - Atencion al Cliente: 900 100 100 - www.naturgy.es");
writeLine(cs, PDType1Font.HELVETICA, 8, MARGIN, 50, 
    "Direccion: Plaza del Gas 1, 08003 Barcelona");
```

---

## 4. ASSETS NECESARIOS

### 4.1. Obtener de www.naturgy.es

**Logo:**
- Descargar logo oficial (SVG o PNG de alta resolución)
- Ubicar en `frontend/public/logo-naturgy.svg`
- Convertir a PNG (300 DPI) para PDF: `backend/src/main/resources/logo-naturgy.png`

**Fuentes:**
- Si Naturgy usa una fuente custom, verificar licencia
- Alternativa: Open Sans (Google Fonts, licencia libre)

### 4.2. Iconos y Elementos

- **Favicon**: Generar desde logo en `frontend/public/favicon.ico`
- **Splash screen**: Opcional para progressive web app

---

## 5. PASOS DE IMPLEMENTACIÓN

### FASE 1: Frontend Web (Estimado: 2-3 horas)

**Paso 1.1: Preparar assets**
- [ ] Descargar logo Naturgy (SVG + PNG)
- [ ] Colocar en `frontend/public/logo-naturgy.svg`
- [ ] Generar favicon

**Paso 1.2: Actualizar theme**
- [ ] Modificar `frontend/src/app/theme.ts` con nuevos colores
- [ ] Agregar fuente Open Sans en `frontend/index.html`
- [ ] Ajustar componentes MUI (Button, Paper, DataGrid)

**Paso 1.3: Actualizar App.tsx**
- [ ] Agregar logo en AppBar
- [ ] Styled Drawer con colores Naturgy
- [ ] Hover effects verde en nav items

**Paso 1.4: Ajustar componentes**
- [ ] Actualizar chips de estado con nuevos colores
- [ ] Revisar buttons (eliminar text-transform si necesario)
- [ ] Ajustar Cards con sombras sutiles

**Paso 1.5: Testing visual**
- [ ] Verificar todas las páginas
- [ ] Comprobar contraste de colores (accesibilidad)
- [ ] Revisar responsive design

### FASE 2: Factura PDF (Estimado: 3-4 horas)

**Paso 2.1: Preparar assets**
- [ ] Convertir logo a PNG 300 DPI
- [ ] Colocar en `backend/src/main/resources/logo-naturgy.png`

**Paso 2.2: Refactorizar PdfService**
- [ ] Agregar constantes de colores RGB
- [ ] Crear métodos helper: `drawHeader()`, `drawTable()`, `drawFooter()`
- [ ] Implementar header con logo y banda verde

**Paso 2.3: Mejorar layout**
- [ ] Sección de datos del cliente en box
- [ ] Tabla de consumo con bordes y fondos alternados
- [ ] Box destacado para total con color verde

**Paso 2.4: Footer corporativo**
- [ ] Línea separadora
- [ ] Información de contacto Naturgy
- [ ] Texto legal (si aplica)

**Paso 2.5: Testing**
- [ ] Generar facturas de prueba
- [ ] Verificar colores PDF correctos
- [ ] Comprobar layout en diferentes tamaños

### FASE 3: Validación y Refinamiento (Estimado: 1-2 horas)

**Paso 3.1: Validación con sitio oficial**
- [ ] Comparar colores con www.naturgy.es
- [ ] Verificar tipografía
- [ ] Ajustar detalles visuales

**Paso 3.2: Documentación**
- [ ] Actualizar README con nuevos colores
- [ ] Documentar ubicación de assets
- [ ] Screenshots del antes/después

**Paso 3.3: Performance**
- [ ] Optimizar tamaño de imágenes
- [ ] Verificar tiempo de generación de PDF

---

## 6. CHECKLIST DE CALIDAD

### Visual
- [ ] Logo visible y legible en todas las pantallas
- [ ] Colores corporativos aplicados consistentemente
- [ ] Tipografía coherente (tamaños, pesos)
- [ ] Espaciado uniforme (múltiplos de 8px)
- [ ] Bordes y sombras sutiles

### UX
- [ ] Contraste de colores cumple WCAG AA (mínimo 4.5:1)
- [ ] Hover states visibles en elementos interactivos
- [ ] Loading states con colores de marca
- [ ] Success/Error feedback con colores apropiados

### PDF
- [ ] Logo Naturgy visible en header
- [ ] Colores corporativos en elementos destacados
- [ ] Tablas con estructura clara y legible
- [ ] Total destacado visualmente
- [ ] Footer con información de contacto

### Técnico
- [ ] Theme centralizado y fácil de ajustar
- [ ] Assets optimizados (tamaño/calidad)
- [ ] Sin hard-coded colors (usar theme tokens)
- [ ] Colores RGB correctos en PDF

---

## 7. MEJORAS ADICIONALES (Opcionales)

### 7.1. Animaciones Sutiles
- Transiciones suaves en hover (duration: 200ms)
- Fade-in de contenido al cargar páginas
- Skeleton loaders con colores de marca

### 7.2. Loading States Branded
```tsx
<CircularProgress 
  sx={{ color: 'primary.main' }}  // Verde Naturgy
/>
```

### 7.3. Empty States Illustrated
- Iconos grandes en color verde
- Mensajes amigables
- Call-to-action destacados

### 7.4. Factura PDF Avanzada
- Gráfico de consumo histórico
- QR code para pago online
- Código de barras para pago en entidad

---

## 8. RECURSOS Y REFERENCIAS

### Sitio Web Oficial
- **URL**: https://www.naturgy.es
- **Secciones a revisar**: Header, footer, formularios, botones

### Herramientas
- **Color picker**: Chrome DevTools, ColorZilla
- **Contrast checker**: https://webaim.org/resources/contrastchecker/
- **Image optimization**: TinyPNG, Squoosh
- **PDF testing**: Adobe Reader, navegadores

### Assets Corporativos
- Si tienes acceso al brand book de Naturgy, úsalo como referencia principal
- Contactar con departamento de marketing si hay dudas sobre uso de marca

---

## 9. RIESGOS Y CONSIDERACIONES

### 9.1. Marca Registrada
- Verificar que tenemos permiso para usar logo Naturgy
- Workshop educativo: uso razonable
- No para producción comercial sin autorización

### 9.2. Licencia de Fuentes
- Open Sans: Licencia libre (Apache 2.0)
- Si Naturgy usa fuente custom, verificar disponibilidad

### 9.3. Compatibilidad PDF
- PDFBox usa fonts Type1 limitados
- No todos los colores RGB se ven igual en todos los readers
- Testing necesario en múltiples visualizadores

---

## 10. RESULTADO ESPERADO

### Antes
- Colores genéricos (naranja #F5831F, azul #1a2744)
- Sin logo corporativo
- PDF básico en blanco y negro
- Look & feel genérico

### Después
- **Colores Naturgy**: Verde #00A03E, Azul #003B5C
- **Logo visible** en header y sidebar
- **PDF branded** con colores corporativos y estructura profesional
- **Look & feel corporativo** consistente con www.naturgy.es
- **Experiencia de usuario** mejorada y profesional

---

**Próximo paso:** Ejecutar FASE 1 (Frontend Web) comenzando por obtener el logo oficial de Naturgy.
