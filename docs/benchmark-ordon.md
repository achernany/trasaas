# Benchmark: Ordon vs Scorecard de Proveedores
Fecha: 09/07/26 · Fuentes: ordon.net, Gestión, Perú Retail, Andina, LinkedIn

## Qué es Ordon

Startup peruana fundada en 2017. SaaS de **e-procurement/e-sourcing**: su corazón son las
**licitaciones electrónicas y subastas inversas** (proveedores compitiendo en línea por una orden),
negociaciones por rondas, y RFx para compras indirectas. Módulos satélite: base mundial de
proveedores (100+ categorías, compartida entre clientes), homologación (recolección documental
personalizada con fechas de vencimiento), módulo auditor, analítica y API REST.

**Tracción**: +35,000 licitaciones adjudicadas, ~3,000/año; ~US$100M subastados ya en 2020.
Clientes corporativos: Promart, Grupo EFE, Dinet, Senati, Skretting (Ecuador), Cinemex y GTAC
(México). Presencia declarada: Perú, Ecuador, México, EEUU, Países Bajos, EAU.

**Modelo de negocio**: nació cobrando comisión al proveedor por venta (0.75%–3%); hoy opera por
**suscripción del comprador** (gratis para proveedores) con Key Account Manager dedicado,
implementación con análisis de integración, NDA, AWS. Perfil claramente **enterprise**.

## Mapa de solape (módulo por módulo)

| Capacidad | Ordon | Nosotros | Solape |
|---|---|---|---|
| Licitaciones / subastas inversas | ★ Core, 8 años de madurez | No tenemos | Ninguno |
| Negociación por rondas | ★ Core | No tenemos | Ninguno |
| Base de proveedores | Marketplace compartido multi-cliente | Base privada por empresa | Medio |
| Registro / homologación documental | Recolección de docs con vencimientos (el cliente homologa) | Form de 88 preguntas con debida diligencia ISO 37001 + docs con vencimiento | **Alto** |
| Comparativo de cotizaciones | Lo reemplaza con el evento competitivo (RFx/licitación) | Cuadro comparativo ISO: 3 cotizaciones + matriz ponderada + aprobación por montos | Parcial (enfoques distintos) |
| **Evaluación de desempeño (scorecard)** | **No existe** — su mundo termina en la adjudicación | ★ Core: matriz de puntaje, clasificación, ficha firmada | **Cero — nuestro espacio** |
| Re-evaluación programada (6/3/1 meses) | No existe | ★ Sí, con alertas de vencidas | Cero |
| Satisfacción del área usuaria | No existe | ★ En roadmap inmediato | Cero |
| Flujo de aprobación interno por montos | No aplica | ★ Sí (fase 2) | Cero |
| Evidencia de auditoría ISO 9001 | Módulo auditor sobre eventos de sourcing | Expediente completo del ciclo proveedor (fichas, historial, audit log) | Parcial |

## Veredicto: ¿qué tan lejos o cerca?

**No somos competidores frontales — somos adyacentes.** Ordon resuelve *"cómo comprar más
barato"* (ahorro vía competencia entre proveedores). Nosotros resolvemos *"cómo demostrar ante
auditoría que compras bien"* (cumplimiento del procedimiento ISO: selección, evaluación,
re-evaluación, trazabilidad). Sus testimonios hablan de ahorros; el nuestro hablaría de auditorías
pasadas sin observaciones.

En SU cancha (sourcing) nos llevan años luz: 8+ años, decenas de clientes corporativos, multi-país.
No competir ahí. En NUESTRA cancha (scorecard de desempeño + expediente de auditoría), ellos están
en **cero** — su propio FAQ dice "¿Ordon homologa proveedores? No" — y nosotros ya tenemos producto
en producción con un cliente real usándolo.

**Segmento**: Ordon apunta a corporativos con departamentos de compras grandes (Promart, EFE).
Nuestro nicho natural son las medianas/contratistas peruanas (como Alfaco) que sufren auditorías de
sus clientes grandes (Calidda, Contugas, Electrodunas) — un perfil para el que Ordon es
sobredimensionado y caro. Ese segmento es enorme en construcción/servicios y está desatendido.

## Riesgos y jugadas

1. **Riesgo**: que Ordon baje al segmento PYME o agregue scorecard de desempeño (para ellos sería
   un módulo más). Mitigación: velocidad y foco en el nicho contratista + precio.
2. **Jugada de posicionamiento**: "el módulo que Ordon no tiene". Para empresas que ya licitan con
   Ordon o similar, nosotros somos el complemento post-adjudicación. Su API REST abre incluso la
   puerta a una integración futura.
3. **Aprender de ellos**: (a) el modelo comercial free-para-proveedores fue clave para poblar su
   base — nuestro form de registro gratuito para proveedores replica esa lógica; (b) el Key Account
   humano como diferenciador vs tickets; (c) el certificado/homologación vence al año — nuestros
   ciclos 6/3/1 son incluso más finos.
4. **No construir** subastas/licitaciones en el corto plazo: es su fortaleza madura, capital
   intensivo, y nos sacaría del nicho donde ganamos.

## Otros jugadores del entorno (referencia)

La "homologación de proveedores" en Perú la dominan certificadoras de servicio manual (SGS, Bureau
Veritas, Mega Certificaciones, Hodelpe, Icontec): auditorías presenciales, certificado válido 1 año,
proceso caro y lento. Ese modelo es justamente lo que un software self-service como el nuestro
puede erosionar por abajo, igual que Ordon erosionó la licitación manual.
