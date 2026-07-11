// Configuración del Formulario de Registro de Proveedores y Debida Diligencia
// Fuente: LOG-GN-F-P02-09 (Google Form aprobado, export 07/07/26) — 10 secciones.
// El renderer (components/RegistroForm.tsx) interpreta esta estructura.

export type Campo = {
  id: string;
  label: string;
  tipo:
    | "text"
    | "tel"
    | "email"
    | "select"
    | "radio"
    | "checkbox"
    | "grid"
    | "file";
  requerido?: boolean;
  opciones?: string[]; // select / radio
  filas?: string[]; // grid (columnas fijas: SI / NO / No Aplica)
  ayuda?: string;
  multiple?: boolean; // file múltiple
  validacion?: "ruc" | "cci" | "dni";
  ancho?: "medio"; // ocupa media fila en desktop
  showIf?: { campo: string; igualA?: string; rucEmpiezaCon?: string };
};

export type Grupo = {
  id: string;
  titulo: string;
  gate?: Campo; // pregunta Sí/No que habilita el grupo
  camposItem: Campo[]; // campos de cada ítem repetible
  min?: number;
  max?: number;
};

export type Seccion = {
  id: string;
  titulo: string;
  descripcion?: string;
  campos?: Campo[];
  grupos?: Grupo[];
};

const PERSONA_PEP: Campo[] = [
  { id: "nombres", label: "Nombres y apellidos", tipo: "text", requerido: true },
  {
    id: "tipo_doc", ancho: "medio",
    label: "Tipo de documento",
    tipo: "select",
    opciones: ["DNI", "CE", "Pasaporte"],
    requerido: true,
  },
  { id: "num_doc", ancho: "medio", label: "N° de documento", tipo: "text", requerido: true },
  {
    id: "nacionalidad", ancho: "medio",
    label: "Nacionalidad / País de residencia",
    tipo: "text",
    requerido: true,
  },
  {
    id: "es_pep", ancho: "medio",
    label: "¿Es Persona Expuesta Políticamente (PEP)?",
    tipo: "radio",
    opciones: ["Sí", "No"],
    requerido: true,
  },
  {
    id: "pep_detalle",
    label: "Si es PEP, indicar institución y cargo",
    tipo: "text",
    showIf: { campo: "es_pep", igualA: "Sí" },
  },
];

export const FORM_REGISTRO: Seccion[] = [
  {
    id: "condiciones",
    titulo: "Aceptación de condiciones",
    descripcion:
      "La información consignada tiene carácter de Declaración Jurada y podrá ser verificada. Se rige por la Política de Privacidad de Alfa Co S.A.C. y el Sistema de Gestión Antisoborno (ISO 37001 / Ley N° 30424).",
    campos: [
      {
        id: "acepta_condiciones",
        label:
          "Acepto las condiciones y la Política de Privacidad de Alfa Co S.A.C., y autorizo el tratamiento de mis datos personales y de la información empresarial para fines de Registro de Proveedores y Debida Diligencia.",
        tipo: "checkbox",
        requerido: true,
      },
    ],
  },
  {
    id: "datos_generales",
    titulo: "Datos generales del proveedor",
    campos: [
      { id: "razon_social", label: "Razón Social", tipo: "text", requerido: true, ancho: "medio" },
      {
        id: "ruc",
        label: "Número de RUC",
        tipo: "text",
        requerido: true,
        validacion: "ruc",
        ayuda: "11 dígitos. RUC 10 = persona natural, RUC 20 = persona jurídica.",
      },
      {
        id: "tipo_proveedor", ancho: "medio",
        label: "Tipo de proveedor",
        tipo: "radio",
        opciones: ["Bienes", "Servicios", "Ambos"],
        requerido: true,
      },
      {
        id: "actividad", ancho: "medio",
        label: "Actividad principal del negocio",
        tipo: "text",
        requerido: true,
      },
      { id: "direccion", label: "Dirección fiscal", tipo: "text", requerido: true },
      { id: "distrito", label: "Distrito", tipo: "text", requerido: true, ancho: "medio" },
      { id: "provincia", label: "Provincia", tipo: "text", requerido: true, ancho: "medio" },
    ],
  },
  {
    id: "contactos",
    titulo: "Contactos comerciales",
    campos: [
      {
        id: "ventas_nombre", ancho: "medio",
        label: "Nombre del asesor de ventas",
        tipo: "text",
        requerido: true,
      },
      {
        id: "ventas_celular", ancho: "medio",
        label: "Número de celular (ventas)",
        tipo: "tel",
        requerido: true,
      },
      {
        id: "finanzas_nombre", ancho: "medio",
        label: "Nombre del encargado del área financiera",
        tipo: "text",
      },
      {
        id: "finanzas_celular", ancho: "medio",
        label: "Número de celular (finanzas)",
        tipo: "tel",
        requerido: true,
      },
    ],
  },
  {
    id: "bancaria",
    titulo: "Información bancaria",
    descripcion:
      "Las cuentas deben estar vigentes y a nombre de la razón social registrada.",
    campos: [
      {
        id: "banco_soles",
        label: "Banco (soles)",
        tipo: "select",
        opciones: ["BBVA", "BCP", "INTERBANK", "SCOTIABANK", "OTROS"],
        requerido: true,
      },
      {
        id: "cuenta_soles", ancho: "medio",
        label: "Número de cuenta bancaria (soles)",
        tipo: "text",
        requerido: true,
      },
      {
        id: "cci_soles", ancho: "medio",
        label: "Código CCI (soles)",
        tipo: "text",
        validacion: "cci",
      },
      {
        id: "banco_dolares",
        label: "Banco (dólares, en caso cuente)",
        tipo: "select",
        opciones: ["BBVA", "BCP", "INTERBANK", "SCOTIABANK", "OTROS"],
      },
      {
        id: "cuenta_dolares", ancho: "medio",
        label: "Número de cuenta bancaria (dólares)",
        tipo: "text",
      },
      { id: "cci_dolares", ancho: "medio", label: "Código CCI (dólares)", tipo: "text" },
      {
        id: "detracciones", ancho: "medio",
        label: "¿Está afecto a detracciones?",
        tipo: "radio",
        opciones: ["SI", "NO"],
        requerido: true,
      },
      {
        id: "cuenta_detraccion", ancho: "medio",
        label: "Cuenta de detracción (si brinda servicios)",
        tipo: "text",
        showIf: { campo: "detracciones", igualA: "SI" },
      },
      {
        id: "condicion_pago",
        label: "Condición de pago",
        tipo: "select",
        opciones: [
          "CREDITO 7 DÍAS",
          "CREDITO 15 DÍAS",
          "CREDITO 30 DÍAS",
          "CREDITO 45 A 60 DÍAS",
          "CONTADO",
        ],
        requerido: true,
      },
    ],
  },
  {
    id: "capacidad",
    titulo: "Capacidad y experiencia",
    campos: [
      {
        id: "anios_mercado", ancho: "medio",
        label: "Años en el mercado local",
        tipo: "select",
        opciones: ["0 - 2 AÑOS", "3 - 5 AÑOS", "6 - 10 AÑOS", "MÁS DE 10 AÑOS"],
        requerido: true,
      },
      {
        id: "cobertura", ancho: "medio",
        label: "Cobertura de atenciones",
        tipo: "radio",
        opciones: ["LOCAL", "A NIVEL NACIONAL"],
        requerido: true,
      },
    ],
  },
  {
    id: "referencias",
    titulo: "Referencias comerciales",
    campos: [
      {
        id: "ref1_empresa",
        label: "Referencia 1 — Razón social y RUC",
        tipo: "text",
        requerido: true,
      },
      {
        id: "ref1_contacto", ancho: "medio",
        label: "Referencia 1 — Número de contacto",
        tipo: "tel",
        requerido: true,
      },
      {
        id: "ref1_correo", ancho: "medio",
        label: "Referencia 1 — Correo",
        tipo: "email",
        requerido: true,
      },
      {
        id: "ref2_empresa",
        label: "Referencia 2 — Razón social y RUC",
        tipo: "text",
        requerido: true,
      },
      {
        id: "ref2_contacto", ancho: "medio",
        label: "Referencia 2 — Número de contacto",
        tipo: "tel",
        requerido: true,
      },
      { id: "ref2_correo", ancho: "medio", label: "Referencia 2 — Correo", tipo: "email" },
    ],
  },
  {
    id: "rep_legal",
    titulo: "Datos del representante legal",
    campos: [
      {
        id: "rl_nombres",
        label: "Nombres y apellidos",
        tipo: "text",
        requerido: true,
      },
      {
        id: "rl_tipo_doc", ancho: "medio",
        label: "Tipo de documento",
        tipo: "select",
        opciones: ["DNI", "CE", "Pasaporte"],
        requerido: true,
      },
      {
        id: "rl_num_doc", ancho: "medio",
        label: "N° de documento",
        tipo: "text",
        requerido: true,
      },
      {
        id: "rl_correo", ancho: "medio",
        label: "Correo electrónico",
        tipo: "email",
        requerido: true,
      },
      {
        id: "rl_es_pep", ancho: "medio",
        label: "¿Es Persona Expuesta Políticamente (PEP)?",
        tipo: "radio",
        opciones: ["Sí", "No"],
        requerido: true,
      },
      {
        id: "rl_pep_detalle",
        label: "Si es PEP, indicar institución y cargo",
        tipo: "text",
        showIf: { campo: "rl_es_pep", igualA: "Sí" },
      },
    ],
  },
  {
    id: "relacionadas",
    titulo: "Personas relacionadas con la empresa (debida diligencia)",
    grupos: [
      {
        id: "accionistas",
        titulo: "Accionistas, socios o asociados con 25% o más de participación",
        gate: {
          id: "tiene_accionistas",
          label: "¿La empresa cuenta con socios y/o accionistas?",
          tipo: "radio",
          opciones: ["Sí", "No"],
          requerido: true,
        },
        camposItem: [
          {
            id: "participacion",
            label: "Porcentaje de participación",
            tipo: "text",
            requerido: true,
          },
          ...PERSONA_PEP,
        ],
        min: 1,
        max: 10,
      },
      {
        id: "directivos",
        titulo:
          "Principales representantes: directores, gerentes o personal con poder de disposición",
        gate: {
          id: "tiene_directivos",
          label:
            "¿La empresa cuenta con personal directivo, gerencial y/o con poder de disposición?",
          tipo: "radio",
          opciones: ["Sí", "No"],
          requerido: true,
        },
        camposItem: [
          { id: "cargo", label: "Cargo", tipo: "text", requerido: true },
          ...PERSONA_PEP,
        ],
        min: 1,
        max: 10,
      },
      {
        id: "vinculadas",
        titulo: "Personas jurídicas vinculadas al cliente y/o su grupo económico",
        gate: {
          id: "tiene_vinculadas",
          label:
            "¿La empresa cuenta con personas jurídicas vinculadas al cliente y/o a su grupo económico?",
          tipo: "radio",
          opciones: ["Sí", "No"],
          requerido: true,
        },
        camposItem: [
          {
            id: "razon_social",
            label: "Razón social",
            tipo: "text",
            requerido: true,
          },
          {
            id: "tipo_id_fiscal", ancho: "medio",
            label: "Registro de identificación fiscal",
            tipo: "select",
            opciones: ["RUC", "RUT", "Otro"],
            requerido: true,
          },
          {
            id: "num_id_fiscal", ancho: "medio",
            label: "Número RUC / RUT / Otro",
            tipo: "text",
            requerido: true,
          },
          {
            id: "pais",
            label: "País de constitución",
            tipo: "text",
            requerido: true,
          },
        ],
        min: 1,
        max: 10,
      },
      {
        id: "antecedentes",
        titulo: "Antecedentes de personas relacionadas",
        gate: {
          id: "tiene_antecedentes",
          label:
            "¿Alguno de los accionistas, directores o vinculados posee investigaciones o condenas vigentes? (incluye corrupción, lavado de activos, criminalidad organizada, delitos tributarios, entre otros)",
          tipo: "radio",
          opciones: ["Sí", "No"],
          requerido: true,
        },
        camposItem: [
          {
            id: "nombres",
            label: "Nombre y apellidos",
            tipo: "text",
            requerido: true,
          },
          {
            id: "estatus", ancho: "medio",
            label: "Estatus",
            tipo: "select",
            opciones: ["Sentenciado", "Investigado"],
            requerido: true,
          },
          {
            id: "delito", ancho: "medio",
            label: "Delito y año de denuncia",
            tipo: "text",
            requerido: true,
          },
        ],
        min: 1,
        max: 10,
      },
    ],
  },
  {
    id: "antisoborno",
    titulo: "Sistema antisoborno y modelo de prevención",
    descripcion:
      "Documentos de referencia: GG-GN-PO-06 Política de Anticorrupción y LOG-GN-CO-01 Código de Ética y Conducta de Proveedores.",
    campos: [
      {
        id: "acepta_anticorrupcion",
        label:
          "Declaro que he leído, comprendido y acepto la Política de Anticorrupción (GG-GN-PO-06) y el Código de Ética y Conducta de Proveedores (LOG-GN-CO-01) de ALFACO, comprometiéndome a cumplir sus disposiciones.",
        tipo: "checkbox",
        requerido: true,
      },
      {
        id: "sgas_juridica",
        label: "Persona jurídica (RUC 20): sistema antisoborno y modelo de prevención",
        tipo: "grid",
        requerido: true,
        showIf: { campo: "ruc", rucEmpiezaCon: "20" },
        filas: [
          "¿Cuenta con un Sistema de Gestión Antisoborno acorde a la ISO 37001, o acorde a la Ley N° 30424?",
          "¿Cuenta con Código de Ética o Conducta?",
          "¿Cuenta con una Política Antisoborno o Anticorrupción?",
          "¿Cuenta con un canal de denuncias debidamente difundido?",
          "¿La empresa cuenta con un procedimiento para garantizar el cumplimiento de la Política Antisoborno, incluyendo medidas disciplinarias por incumplimiento?",
          "¿El proveedor cuenta con un programa de concientización y formación antisoborno?",
        ],
      },
      {
        id: "sgas_natural",
        label: "Persona natural (RUC 10): sistema antisoborno y modelo de prevención",
        tipo: "grid",
        requerido: true,
        showIf: { campo: "ruc", rucEmpiezaCon: "10" },
        filas: [
          "¿Conoce sobre la norma ISO 37001, que establece el Sistema de Gestión Antisoborno?",
          "¿Tiene implementado o participado en un sistema de Gestión Antisoborno?",
          "¿Conoce las medidas a las que se somete en caso de incumplir políticas anticorrupción y/o antisoborno?",
        ],
      },
    ],
  },
  {
    id: "conflicto",
    titulo: "Conflicto de interés",
    grupos: [
      {
        id: "conflictos",
        titulo: "Declaración de posibles conflictos de interés",
        gate: {
          id: "tiene_conflicto",
          label:
            "¿Sus socios, accionistas, directivos o trabajadores mantienen algún parentesco con personas que laboran en Alfa Co S.A.C., o alguna relación personal, laboral o comercial con Alfa Co S.A.C. que pueda generar conflicto de interés?",
          tipo: "radio",
          opciones: ["Sí", "No"],
          requerido: true,
        },
        camposItem: [
          {
            id: "persona_alfaco", ancho: "medio",
            label: "Nombre de la persona vinculante (de Alfa Co)",
            tipo: "text",
            requerido: true,
          },
          {
            id: "cargo_alfaco", ancho: "medio",
            label: "Cargo que ocupa",
            tipo: "text",
            requerido: true,
          },
          {
            id: "tipo_relacion", ancho: "medio",
            label: "Tipo de relación",
            tipo: "select",
            opciones: ["Familiar", "Personal", "Laboral", "Comercial", "Otro"],
            requerido: true,
          },
          {
            id: "parentesco", ancho: "medio",
            label: "Parentesco y/o relación",
            tipo: "text",
            requerido: true,
          },
          {
            id: "persona_empresa", ancho: "medio",
            label: "Persona relacionada de su empresa",
            tipo: "text",
            requerido: true,
          },
          {
            id: "cargo_empresa", ancho: "medio",
            label: "Cargo que ocupa",
            tipo: "text",
            requerido: true,
          },
          {
            id: "descripcion",
            label: "Descripción del posible conflicto",
            tipo: "text",
          },
        ],
        min: 1,
        max: 5,
      },
    ],
    campos: [
      {
        id: "declara_sin_influencia",
        label:
          "Declaro que las relaciones familiares, sentimentales, comerciales, societarias o económicas que pudiera mantener no generan ni podrían generar influencia indebida ni conflictos de interés con la empresa o sus partes relacionadas.",
        tipo: "checkbox",
        requerido: true,
      },
      {
        id: "declara_veracidad",
        label:
          "Declaro bajo juramento que la información es veraz y correcta, y me comprometo a informar por escrito dentro de los 5 días hábiles cualquier cambio o situación que pueda generar un conflicto de interés real, potencial o aparente.",
        tipo: "checkbox",
        requerido: true,
      },
    ],
  },
  {
    id: "documentos",
    titulo: "Carga de documentos",
    campos: [
      {
        id: "doc_dj_veracidad",
        label:
          "DJ de Veracidad de Información (LOG-GN-F-P02-08) firmada por el representante legal, escaneada en PDF",
        tipo: "file",
        requerido: true,
      },
      {
        id: "doc_sustento",
        label:
          "Adjuntar: (1) Copia del RUC / reporte tributario, (2) Certificación bancaria con todos los datos de la cuenta, (3) Certificado de vigencia por Registros Públicos (persona natural: no aplica)",
        tipo: "file",
        requerido: true,
        multiple: true,
      },
    ],
  },
];
