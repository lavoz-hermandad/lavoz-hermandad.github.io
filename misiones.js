/* ============================================================================
   LA VOZ — Sistema de misiones por rango
   ----------------------------------------------------------------------------
   CONTRATO CON EL BACKEND (fuente de verdad: ../backend/schema.sql):
   las misiones de esta lista son EXACTAMENTE las 17 misiones semilla de la
   tabla `missions` — mismos `key`, `from_rank`, `to_rank`, `pillar` y `kind`.
   Si una misión cambia, cambia primero en la base (schema.sql) y después acá.

   Cada ascenso se gana completando las misiones de los tres pilares
   (palabra · ejemplo · cuerpo). Cada transición suma 100 puntos.

   Tipos de misión (columna `kind` de la tabla missions):
     · "video"      — se cumple en casa y se prueba con un VIDEO subido a la
                      cuenta (bucket `videos`, ruta {usuario_id}/{key}/{archivo}).
     · "presencial" — se cumple en la célula y la atestigua el Guía (testigo).
   El campo `tipo` es el alias de pantalla de `kind`: "casa" = video,
   "celula" = presencial.

   Regla de oro de los videos de palabra: UNA SOLA TOMA, SIN CORTES NI EDICIÓN.
   Los rangos los otorga únicamente el Fundador (RPC `set_rank`, ver panel de
   Administración): completar las misiones habilita el ascenso; no lo ejecuta
   automáticamente.

   Las misiones reproducen las tres pruebas oficiales de cada rango
   (Documento 1 — La Célula), sin ningún requisito de idiomas.
   ========================================================================== */

/* Rangos del sistema = valores del enum `rank_t` del backend, en orden.
   El Fundador ('fundador') está por encima de la escalera de misiones:
   no se llega a él completando misiones. */
const RANGOS = ["aspirante", "iniciado", "orador", "guia", "maestro"];
const RANGO_FUNDADOR = "fundador";

/* Nombre visible de cada rango (las claves internas son las del backend). */
const RANGO_NOMBRES = {
  aspirante: "Aspirante",
  iniciado: "Iniciado",
  orador: "Orador",
  guia: "Guía",
  maestro: "Maestro",
  fundador: "Fundador",
};

function nombreRango(clave) {
  return RANGO_NOMBRES[clave] || clave;
}

const PILARES = {
  palabra: { nombre: "Palabra", frase: "Palabra clara" },
  ejemplo: { nombre: "Ejemplo", frase: "Ejemplo firme" },
  cuerpo: { nombre: "Cuerpo", frase: "Cuerpo fuerte" },
};

/* Regla que se muestra en toda misión de discurso grabado. */
const REGLA_VIDEO_DISCURSO = "Una sola toma, sin cortes ni edición.";

/* Misiones necesarias para ALCANZAR cada rango.
   Clave del objeto = `to_rank` del backend; `id` de cada misión = su `key`
   en la tabla `missions`. El texto de pantalla (titulo/descripcion) puede
   ser más rico que el de la base; la identidad de la misión es la `key`. */
const MISIONES_POR_RANGO = {
  iniciado: [
    {
      id: "asp_ini_palabra_video",
      pilar: "palabra",
      kind: "video",
      tipo: "casa",
      titulo: "Discurso de 3 minutos",
      descripcion:
        "Tu primer discurso: 3 minutos, con apertura clara, tres ideas y cierre. Grabalo en casa y subilo en video: vale tu palabra real, sin retoques.",
      videoDiscurso: true,
      puntos: 30,
    },
    {
      id: "asp_ini_ejemplo_logistica",
      pilar: "ejemplo",
      kind: "presencial",
      tipo: "celula",
      titulo: "Apoyar la logística de una reunión",
      descripcion:
        "Llegar antes, preparar el espacio, la formación y los materiales de una sesión completa, y dejar todo en orden. Lo atestigua tu Guía.",
      puntos: 15,
    },
    {
      id: "asp_ini_ejemplo_aspirante",
      pilar: "ejemplo",
      kind: "presencial",
      tipo: "celula",
      titulo: "Traer 1 aspirante y enseñarle el lema",
      descripcion:
        "Invitar a una persona a conocer la hermandad, acompañarla en su primera sesión y enseñarle el lema — «Nadie se forja solo». Cada uno trae uno. Lo confirma tu Guía.",
      puntos: 25,
    },
    {
      id: "asp_ini_cuerpo_video",
      pilar: "cuerpo",
      kind: "video",
      tipo: "casa",
      titulo: "Marca base: flexiones y plancha",
      descripcion:
        "Grabá tu punto de partida, de cuerpo entero y sin cortes: máximo de flexiones con técnica y tiempo de plancha. Es tu marca base: todo lo que sigue se mide contra ella.",
      puntos: 15,
    },
    {
      id: "asp_ini_cuerpo_2km",
      pilar: "cuerpo",
      kind: "presencial",
      tipo: "celula",
      titulo: "Marca base: 2 km cronometrados",
      descripcion:
        "Correr 2 km en sesión, con el tiempo registrado por tu Guía. Queda asentado como tu marca base de resistencia.",
      puntos: 15,
    },
  ],

  orador: [
    {
      id: "ini_ora_palabra_video",
      pilar: "palabra",
      kind: "video",
      tipo: "casa",
      titulo: "Discurso de 5 minutos: tema sorteado",
      descripcion:
        "Tu Guía te sortea un tema, preparás en el tiempo indicado y grabás tu discurso de 5 minutos en casa: estructura completa, manejo del tiempo y cierre con fuerza. Vale la primera versión: es tu palabra real, sin retoques.",
      videoDiscurso: true,
      puntos: 35,
    },
    {
      id: "ini_ora_palabra_debate",
      pilar: "palabra",
      kind: "presencial",
      tipo: "celula",
      titulo: "Defender una postura en debate",
      descripcion:
        "Defender una postura durante 2 minutos en un debate en vivo de la célula, respondiendo una objeción sin perder la calma ni el hilo.",
      puntos: 15,
    },
    {
      id: "ini_ora_ejemplo_reunion",
      pilar: "ejemplo",
      kind: "presencial",
      tipo: "celula",
      titulo: "Organizar una reunión completa",
      descripcion:
        "Convocar, preparar el lugar, llevar los tiempos y cerrar la sesión: la logística entera de una reunión, sobre tus hombros. Lo atestigua tu Guía.",
      puntos: 15,
    },
    {
      id: "ini_ora_ejemplo_ahijados",
      pilar: "ejemplo",
      kind: "presencial",
      tipo: "celula",
      titulo: "Mantener 3 ahijados activos",
      descripcion:
        "Acompañar a 3 integrantes de tu célula durante un ciclo completo: que asistan, que practiquen y que no queden solos en el camino. Lo confirma tu Guía.",
      puntos: 20,
    },
    {
      id: "ini_ora_cuerpo_video",
      pilar: "cuerpo",
      kind: "video",
      tipo: "casa",
      titulo: "Superar tu marca base en un 25%",
      descripcion:
        "Subí el video de tu nueva marca: flexiones y plancha, de cuerpo entero y sin cortes, un 25% por encima de tu marca base y con la misma técnica.",
      puntos: 15,
    },
  ],

  guia: [
    {
      id: "ora_gui_palabra_publico",
      pilar: "palabra",
      kind: "presencial",
      tipo: "celula",
      titulo: "Discurso de 7 minutos ante público",
      descripcion:
        "Un discurso de 7 minutos ante público real — una sesión abierta o un evento de la hermandad: dominio del tema, del espacio y de la audiencia, fuera de tu zona de comodidad.",
      puntos: 30,
    },
    {
      id: "ora_gui_ejemplo_celula",
      pilar: "ejemplo",
      kind: "presencial",
      tipo: "celula",
      titulo: "Abrir y sostener tu propia célula de 12",
      descripcion:
        "La misión corazón del Modelo 12: reunir tu semilla, abrir tu célula, sostener la sesión semanal y llevarla a 12 hermanos estables. Se cumple con la célula viva y sesionando, y se respalda con tu Acta de Designación firmada.",
      puntos: 50,
    },
    {
      id: "ora_gui_cuerpo_video",
      pilar: "cuerpo",
      kind: "video",
      tipo: "casa",
      titulo: "Alcanzar la marca avanzada",
      descripcion:
        "Subí el video de la marca avanzada de tu tabla por edad: cuerpo entero, sin cortes, en los niveles que define el Círculo.",
      puntos: 20,
    },
  ],

  maestro: [
    {
      id: "gui_mae_palabra_ponencia",
      pilar: "palabra",
      kind: "presencial",
      tipo: "celula",
      titulo: "Ponencia de 10 minutos",
      descripcion:
        "Una ponencia completa de 10 minutos ante la hermandad: tema dominado en profundidad, estructura impecable y cierre que quede resonando.",
      puntos: 25,
    },
    {
      id: "gui_mae_ejemplo_capacitacion",
      pilar: "ejemplo",
      kind: "presencial",
      tipo: "celula",
      titulo: "Dictar una capacitación completa",
      descripcion:
        "Enseñar es la prueba del Maestro: diseñá y dictá una formación entera para otros hermanos, con práctica guiada y devolución.",
      puntos: 25,
    },
    {
      id: "gui_mae_ejemplo_celulas",
      pilar: "ejemplo",
      kind: "presencial",
      tipo: "celula",
      titulo: "Formar Guías y acompañar células",
      descripcion:
        "Formar a los Guías que vienen detrás y acompañar las células de tu generación: hasta 12 células bajo tu cuidado, sin suplantar a sus Guías, como marca el Modelo 12.",
      puntos: 35,
    },
    {
      id: "gui_mae_cuerpo_video",
      pilar: "cuerpo",
      kind: "video",
      tipo: "casa",
      titulo: "Excelencia física sostenida: 6 meses",
      descripcion:
        "No es una marca: es una constancia. Subí un video de control por mes, durante 6 meses, manteniendo tu nivel de excelencia física.",
      serie: true,
      puntos: 15,
    },
  ],
};

/* ------------------------- Utilidades del sistema ------------------------ */

function siguienteRango(rango) {
  const i = RANGOS.indexOf(rango);
  return i >= 0 && i < RANGOS.length - 1 ? RANGOS[i + 1] : null;
}

function misionesDelSiguienteRango(rango) {
  const sig = siguienteRango(rango);
  return sig ? MISIONES_POR_RANGO[sig] : [];
}

function totalPuntos(rangoDestino) {
  return (MISIONES_POR_RANGO[rangoDestino] || []).reduce((s, m) => s + m.puntos, 0);
}

/* Estados de pantalla de una misión:
   "pendiente" | "en_revision" | "aprobada" | "rechazada".
   En el backend son los `status` de la tabla `submissions`
   ('pendiente' | 'en_revision' | 'aprobada' | 'rechazada'): sin envío
   registrado, la misión está "pendiente"; un envío en 'pendiente' o
   'en_revision' se muestra "en_revision" (ya fue enviado y espera revisión). */
function puntosAprobados(misiones, progreso) {
  return misiones.reduce((s, m) => {
    const reg = progreso[m.id];
    return s + (reg && reg.estado === "aprobada" ? m.puntos : 0);
  }, 0);
}
