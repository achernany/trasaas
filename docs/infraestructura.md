# Infraestructura del producto (07/07/26)

## Cuentas (correo del producto: scorecardproveedores@gmail.com)
- GitHub org/usuario: `scorecardproveedores-erp`
- Repo: https://github.com/scorecardproveedores-erp/scorecard-proveedores (privado, vacío)
- Vercel: cuenta por correo, conectada a GitHub, plan Hobby
- Supabase org: `scorecardproveedores-erp` (Free)

## Proyecto Supabase
- Project ID: `udrlswivsjywttktevci`
- URL: https://udrlswivsjywttktevci.supabase.co
- Región: sa-east-1 (São Paulo)
- Contraseña de la DB y service_role: las guarda Hernany (NUNCA en chats ni en el repo)

## Variables de entorno de la app (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://udrlswivsjywttktevci.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkcmxzd2l2c2p5d3R0a3RldmNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1MTM1NDIsImV4cCI6MjA5OTA4OTU0Mn0.YoDiFZMOiL-NSZqO-ZvR7WEaNOBiI2wwxYr655t__eQ
# SUPABASE_SERVICE_ROLE_KEY=   <- solo en Vercel env vars, nunca en el repo
```
(la anon key es pública por diseño; la seguridad real la dan las políticas RLS)

## Próxima sesión (orden de trabajo)
1. Hernany pega `db/schema.sql` en Supabase → SQL Editor → Run
2. Importar `migracion/proveedores.csv` y `evaluaciones.csv`
3. Generar proyecto Next.js + push inicial al repo + import en Vercel
4. Form de registro de proveedores (spec de 88 preguntas)
