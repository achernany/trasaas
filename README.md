# Scorecard de Proveedores

Módulo de evaluación y selección de proveedores auditable (ISO 9001 / ISO 37001).
Stack: Next.js 14 + Supabase (Postgres, Auth, Storage) + Vercel. Multi-tenant.

## Estado (07/07/26 · noche)

- [x] Esquema de base de datos cargado en Supabase (24 tablas, RLS activado)
- [x] `db/seed.sql` — empresa, categorías, proyectos, matrices, niveles de aprobación
- [x] `db/import.sql` — base real migrada: 105 proveedores, 155 proveedor-categoría, 339 evaluaciones
- [x] `db/policies.sql` — políticas RLS por tenant + bucket de documentos
- [x] App Next.js: login, panel con dashboard, form público de registro (88 preguntas, LOG-GN-F-P02-09)
- [x] Compilación y tipos verificados
- [ ] Módulo de evaluación con matriz (jueves)
- [ ] Ficha PDF + comparativo + aprobación por correo

## Puesta en marcha (pasos de Hernany)

### 1. SQL en Supabase (SQL Editor, en este orden)
1. `db/seed.sql` → Run
2. `db/import.sql` → Run
3. `db/policies.sql` → Run

### 2. Crear los primeros usuarios
1. Dashboard → Authentication → Users → **Add user** → email + contraseña (crear el tuyo y el de Francys)
2. Copiar el UUID de cada usuario y en SQL Editor:
```sql
insert into usuarios (id, empresa_id, nombre, email, rol) values
('<UUID>', (select id from empresas limit 1), 'Francys Nava', 'correo@...', 'admin');
```

### 3. Subir el código a GitHub
```bash
cd scorecard-proveedores
git init && git add -A && git commit -m "MVP: fundación + registro de proveedores"
git branch -M main
git remote add origin https://github.com/scorecardproveedores-erp/scorecard-proveedores.git
git push -u origin main
```
(si pide credenciales: GitHub → Settings → Developer settings → Personal access tokens → generar uno con scope `repo` y usarlo como contraseña)

### 4. Desplegar en Vercel
1. Vercel → Add New → Project → importar `scorecard-proveedores`
2. En **Environment Variables** agregar las 3 de `.env.local.example`:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y
   `SUPABASE_SERVICE_ROLE_KEY` (esta la copias de Supabase → Settings → API Keys → service_role; solo va aquí)
3. Deploy

### 5. Probar
- `https://<tu-app>.vercel.app/login` → entrar con tu usuario → dashboard con los datos reales
- Crear un link de registro de prueba (SQL Editor):
```sql
insert into proveedor_registros (empresa_id, token_acceso)
values ((select id from empresas limit 1), 'demo-proveedor-001');
```
- Abrir `https://<tu-app>.vercel.app/registro/demo-proveedor-001` → el form completo

## Estructura

```
app/                  Next.js App Router
  login/              Autenticación del equipo
  panel/              Panel interno (dashboard; proveedores/evaluaciones/cuadros en construcción)
  registro/[token]/   Form público del proveedor (por link único)
  api/registro/       Recepción del form + subida de PDFs (service role)
components/           RegistroForm (renderer genérico multi-paso)
lib/registro-config.ts  Las 88 preguntas como configuración — editar textos aquí
lib/supabase/         Clientes browser/server
db/                   schema.sql · seed.sql · import.sql · policies.sql
migracion/            Scripts de extracción del Excel + CSVs
docs/                 Specs y decisiones
```

## Decisiones de diseño

1. Matrices versionadas en datos (pesos de Francys "en aprobación" → cambiar sin código)
2. `proveedor_categorias`: un RUC se califica por categoría (99/105 casos reales)
3. Checklist documental eliminatorio (LOG-F-P03-01)
4. Re-evaluación programada 6/3/1 meses según calificación (LOG-P-03)
5. Flag rutinario/emergencia exime mínimo de 3 cotizaciones (LOG-GN-P-02)
6. Form de registro config-driven: mejoras sobre Google Forms (listas dinámicas,
   grid según RUC 10/20, DJ pre-llenada pendiente)
7. `audit_log` en cada acción — la trazabilidad es el producto
