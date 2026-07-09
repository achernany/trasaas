# Especificación — Formulario de Registro de Proveedores y Debida Diligencia
Fuente de verdad: export PDF del Google Form LOG-GN-F-P02-09 (07/07/26).
Alineado a ISO 37001 / Ley N° 30424 (antisoborno). Todo el envío tiene carácter de Declaración Jurada.

## Sección 1 — Aceptación de condiciones
| # | Campo | Tipo | Req |
|---|-------|------|-----|
| 1 | Acepta condiciones + política de privacidad + tratamiento de datos | checkbox | ✔ |

## Sección 2 — Datos generales
| 2 | Razón Social | texto | ✔ |
| 3 | Número de RUC | texto, validar 11 dígitos; prefijo 10=Persona Natural / 20=Jurídica (dispara lógica S.9) | ✔ |
| 4 | Tipo de proveedor | radio: Bienes / Servicios / Ambos | ✔ |
| 5 | Actividad principal del negocio | texto | ✔ |
| 6 | Dirección fiscal | texto | ✔ |
| 7 | Distrito | texto | ✔ |
| 8 | Provincia | texto | ✔ |

## Sección 3 — Contactos comerciales
| 9–10 | Asesor de ventas: nombre + celular | texto/tel | ✔ |
| 11–12 | Encargado área financiera: nombre + celular | texto/tel | nombre opcional, celular ✔ |

## Sección 4 — Información bancaria
| 13 | Banco soles | select: BBVA/BCP/INTERBANK/SCOTIABANK/OTROS | ✔ |
| 14 | N° cuenta soles | texto | ✔ |
| 15 | CCI soles | texto (validar 20 dígitos) | – |
| 16–18 | Banco/cuenta/CCI dólares | ídem | – |
| 19 | ¿Afecto a detracciones? | radio SI/NO | ✔ |
| 20 | Cuenta de detracción (si brinda servicios) | texto, condicional a 19=SI | – |
| 21 | Condición de pago | select: crédito 7/15/30/45-60 días/contado | ✔ |

## Sección 5 — Capacidad y experiencia
| 22 | Años en el mercado | select: 0-2 / 3-5 / 6-10 / +10 | ✔ |
| 23 | Cobertura | radio: Local / Nacional | ✔ |

## Sección 6 — Referencias comerciales (x2 obligatorias)
| 24–26 | Ref. 1: razón social+RUC, contacto, correo | texto | ✔ |
| 27–29 | Ref. 2: razón social+RUC, contacto, correo | texto | ✔ (correo 2 opcional) |

## Sección 7 — Representante legal
| 30–33 | Nombres, tipo doc (DNI/CE/Pasaporte), n° doc, correo | | ✔ |
| 34–35 | ¿Es PEP? + institución/cargo si sí | radio + condicional | ✔ |

## Sección 8 — Personas relacionadas (debida diligencia)
**8.1 Accionistas ≥25%** (form tiene 2 fijos → en la app: lista dinámica)
| 36 | ¿Tiene socios/accionistas? | radio, gate de la subsección | ✔ |
| 37–43 | Accionista: % participación, nombres, tipo/n° doc, nacionalidad, PEP + detalle | repetible | – |
**8.2 Directivos/gerentes/apoderados** (2 fijos → lista dinámica)
| 51 | ¿Cuenta con personal directivo? | radio, gate | ✔ |
| 52–58 | Personal: cargo, nombres, tipo/n° doc, nacionalidad, PEP + detalle | repetible | – |
**8.3 Personas jurídicas vinculadas al grupo económico**
| 66 | ¿Tiene vinculadas? | radio, gate | ✔ |
| 67–70 | Razón social, tipo id fiscal (RUC/RUT/otro), número, país constitución | repetible | – |
**8.4 Antecedentes**
| 71 | ¿Investigaciones o condenas vigentes? (lista delitos: LA/FT, corrupción, etc.) | radio | ✔ |
| 72–74 | Si sí: nombre, estatus (sentenciado/investigado), delito y año | condicional, repetible | – |

## Sección 9a — Antisoborno (según tipo de RUC)
| 75 | Acepta Política Anticorrupción GG-GN-PO-06 + Código Ética LOG-GN-CO-01 | checkbox | ✔ |
| 76 | **RUC 20**: grid SI/NO/No Aplica × 6 filas: SGAS ISO 37001-Ley 30424, código de ética, política antisoborno, canal de denuncias, procedimiento de cumplimiento+medidas disciplinarias, programa de formación | matriz | ✔ |
| 77 | **RUC 10**: grid SI/NO/No Aplica × 3 filas: conoce ISO 37001, participó en SGAS, conoce medidas por incumplir | matriz | ✔ |
→ En la app: mostrar solo la grid que corresponda según el RUC (mejora vs Google Forms).

## Sección 9b — Conflicto de interés
| 78 | ¿Parentesco/relación con personal de Alfaco o vínculo comercial que genere conflicto? | radio | ✔ |
| 79–85 | Si sí: persona vinculante, cargo, tipo de relación (familiar/personal/laboral/comercial/otro), parentesco, persona de su empresa, cargo, descripción | condicional | – |
| 86 | Declaraciones juradas finales (no influencia indebida + veracidad + compromiso de informar cambios en 5 días hábiles) | checkbox x2 | ✔ |

## Sección 10 — Carga de documentos
| 87 | DJ Veracidad de información (LOG-GN-F-P02-08) firmada por rep. legal, escaneada PDF | file | ✔ |
| 88 | Copia RUC/reporte tributario + certificación bancaria + vigencia de poder RRPP (PN no aplica) | files múltiples | ✔ |

## Reglas de implementación
1. **Todo obligatorio salvo condicionales** (regla de Francys: sin diligenciar no hay registro).
2. Lógica por tipo de RUC (10/20) derivada automáticamente del campo RUC.
3. Accionistas/directivos/vinculadas como **listas dinámicas** (el form los limita a 2 por limitación de Google Forms).
4. **Mejora**: generar la DJ (LOG-GN-F-P02-08) pre-llenada con los datos del form para que el proveedor solo la imprima, firme y suba.
5. Guardar en `proveedor_registros.form_data` (JSONB) + archivos en Storage con tipo etiquetado.
6. Al validar el registro (coordinadora), se crea/activa el `proveedor` y queda listo para selección.

## Decisión cerrada (Francys, 07/07/26)
El Google Form ES la versión final aprobada: **apegarse al form tal cual**. Los campos extra del
Word "DEBIDA DILIGENCIA Original" (Lavado de Activos/UIF, CIIU, PEP ampliado) quedan FUERA del
alcance. Si auditoría los pidiera a futuro, se agregan como campos nuevos sin tocar lo existente.
