1) DB Scaffold

Título: DB Scaffold: datos + seed desde _data/db/samples

Descripción:
Montar la capa de datos del workshop: entidades/repositorios y seed reproducible desde _data/db/samples/, alineado con el SSOT en _data/specs/. Dejar PR con modelo + carga inicial funcionando.

2) Backend Scaffold

Título: Backend Scaffold: Spring Boot API + facturación + PDF

Descripción:
Generar backend Spring Boot con endpoints CRUD mínimos y endpoint de facturación E2E (m³→kWh→fijo/variable→alquiler→IVA) + PDF, siguiendo _data/specs/. Dejar PR con ejecución end-to-end.

3) Frontend Scaffold

Título: Frontend Scaffold: React/Vite UI CRUD + facturar

Descripción:
Generar frontend React/Vite/TS con pantallas CRUD (CUPS, lecturas, tarifas, factores, impuestos) y acción de facturar consumiendo /api. Seguir SSOT _data/specs/. PR listo para demo.

4) Frontend Standards / Refactor

Título: Frontend Refactor: alinear con estándares React (Space "React-Standards")

Descripción:
Refactor del frontend para alinearlo con los estándares definidos en el GitHub Copilot Space "React-Standards". Buscar primero en Space y, si falta algún criterio, usar como fallback las especificaciones del repo react-standards.md). 