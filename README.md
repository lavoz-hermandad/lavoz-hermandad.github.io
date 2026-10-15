# LA VOZ — Aplicación web (sitio público + área de miembros)

Nueva versión de la web de LA VOZ, construida el 11 de octubre de 2026.
Convive con la web anterior (`../web/`), que no se tocó: esta carpeta es la
base para reemplazarla cuando el backend esté conectado.

Identidad: negro `#0A0A0A`, bermellón `#E34234`, lema **«Nadie se forja solo.»**
Sin identidad trilingüe y sin sede única: LA VOZ abre bases en cualquier
lugar, y cada base vive en su propio idioma.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | Sitio público **bilingüe ES/EN** (selector en el encabezado; la preferencia se guarda). Botón **«Ingresar»** arriba a la derecha → `ingresar.html`. El botón «Quiero sumarme» enlaza al formulario de Google vigente, el mismo de la web actual. |
| `ingresar.html` | Inicio de sesión y **registro** (nombre completo, correo, contraseña). Al registrarse, la cuenta nace con rango **aspirante** (lo asigna el trigger del backend, no el usuario). |
| `panel.html` | **Área de miembros** (apartado separado, detrás del login): identidad, mi célula, mi carnet descargable, «Mi camino» con misiones y subida de videos, y las secciones por rol (Guía / Fundador). |
| `misiones.js` | Las **17 misiones** del sistema: las mismas `key` de la tabla `missions` del backend, con el texto de pantalla. Cada transición suma 100 puntos. |
| `config.js` | Credenciales de Supabase (placeholders) y constantes con los nombres reales del backend (`profiles`, `cells`, `submissions`, …). |
| `estilos.css` | Estilos compartidos de las tres pantallas. |

## Modo demostración (sin backend)

Mientras `config.js` tenga los valores de ejemplo (`TU-PROYECTO` /
`TU_ANON_KEY`), la app corre en **modo demostración**:

- `ingresar.html` acepta cualquier correo/contraseña y entra al panel.
- El panel usa datos de prueba **con la misma forma del esquema real**
  (`profiles` / `cells` / envíos) y trae un **selector de roles** (Aspirante →
  Fundador) para previsualizar cómo se ve cada sección, incluida la
  Administración del Fundador y el panel del Guía con revisiones pendientes.
- Los videos no se suben a ningún servidor; las acciones simulan el resultado.

Sirve para revisar diseño y textos sin infraestructura. En cuanto se pegan
las claves reales en `config.js`, el modo demo desaparece solo.

## Contrato con el backend (fuente de verdad: `../backend/`)

El frontend ya está adaptado, nombre por nombre, al paquete de backend:

| Pieza | Archivo del backend | Qué hace |
|---|---|---|
| Esquema | `../backend/schema.sql` | Tablas, enum de rangos, RLS, `set_rank()`, trigger de alta, misiones semilla |
| Storage | `../backend/storage.sql` | Bucket privado `videos` y sus políticas |
| Bienvenida | `../backend/functions/welcome/index.ts` | Edge Function `welcome`: carta + carnet por email al registrarse (webhook sobre INSERT en `profiles`) |
| Despliegue | `../backend/SETUP.md` | Paso a paso completo, en orden |

### Nombres: lo que el frontend usa = lo que la base define

| Frontend (antes) | Backend (real, vigente) |
|---|---|
| tabla `perfiles` | tabla **`profiles`** |
| tabla `celulas` | tabla **`cells`** |
| tabla `progreso_misiones` | **no existe**: el progreso se deriva de la tabla **`submissions`** |
| `nombre_completo` | `full_name` |
| `lvz` | `lvz_code` (generado: `LVZ-` + `lvz_number` correlativo) |
| `rango` con valores «Guía», «Maestro»… | `rank` con el enum `aspirante · iniciado · orador · guia · maestro · fundador` (sin tildes, minúscula; la pantalla traduce con `nombreRango()`) |
| `es_fundador = true` (marca) | **`rank = 'fundador'`** (un valor más del enum; así gatea el panel de Administración) |
| `celula_id` | `cell_id` |
| `estado` / `video_path` / `atestiguado_por` | `status` / `storage_path` / `reviewed_by` (+ `reviewed_at`, `review_note`) en `submissions` |
| RPC `fundador_asignar_rango(p_usuario, p_rango)` | RPC **`set_rank(target_user, new_rank, note)`** — solo fundador; protege al único fundador; todo queda en **`rank_history`** |
| trigger `al_crear_usuario` | trigger **`handle_new_user`** (sobre `auth.users`): crea el `profiles` como `aspirante` con su LVZ — lee el nombre del metadato **`full_name`** del registro |
| Edge Function `bienvenida` | Edge Function **`welcome`** |
| — (no existía) | RPC `set_member_status(target_user, new_status)` — el fundador activa/desactiva cuentas; una cuenta `disabled` no lee nada (RLS) |
| — (no existía) | `bootstrap_founder(email)` — solo SQL Editor, solo mientras no haya fundador (ver `SETUP.md` §9) |

### Flujo de datos del panel

1. **Auth real**: registro/login con correo y contraseña (Supabase Auth). El
   registro envía `options.data.full_name`; el trigger crea el perfil.
2. **Mi célula**: `profiles.cell_id` → fila de `cells`
   (`name, meeting_day, meeting_place, city, country, guide_id`); el nombre
   del guía sale de `profiles.full_name` de `cells.guide_id`.
3. **Mi camino**: las misiones del siguiente rango salen de `misiones.js`
   (espejo de la tabla `missions`); el estado de cada una se **deriva de mis
   filas en `submissions`**: sin envío = *pendiente*; envío en `pendiente` o
   `en_revision` = *en revisión*; `aprobada` = *aprobada*; `rechazada` =
   *devuelta* (puedo reenviar: se crea un envío nuevo).
4. **Videos**: bucket privado `videos`, ruta obligatoria
   `{user_id}/{mission_key}/{archivo}`. El Guía de mi célula los abre con
   enlaces firmados temporales.
5. **Guía**: mi célula es la que tiene `cells.guide_id = yo` (no mi
   `cell_id`); reviso los `submissions` de sus miembros con un UPDATE que
   fija `status`, `reviewed_by` y `reviewed_at`.
6. **Fundador** (`rank = 'fundador'`): lee todos los `profiles` (RLS) y
   otorga/quita rangos **solo** vía `set_rank`. La interfaz espeja la
   protección del servidor: el selector del **único fundador** queda
   deshabilitado, porque el backend prohíbe degradarlo.

### Mapa final de misiones (frontend → backend)

Las 17 misiones semilla de `schema.sql`. `kind`: `video` = en casa con video
(`tipo: "casa"` en pantalla) · `presencial` = en la célula con testigo
(`tipo: "celula"`).

| Transición | Key en la base (= `id` en `misiones.js`) | Pilar | Kind |
|---|---|---|---|
| aspirante → iniciado | `asp_ini_palabra_video` | palabra | video |
| | `asp_ini_ejemplo_logistica` | ejemplo | presencial |
| | `asp_ini_ejemplo_aspirante` | ejemplo | presencial |
| | `asp_ini_cuerpo_video` | cuerpo | video |
| | `asp_ini_cuerpo_2km` | cuerpo | presencial |
| iniciado → orador | `ini_ora_palabra_video` | palabra | video |
| | `ini_ora_palabra_debate` | palabra | presencial |
| | `ini_ora_ejemplo_reunion` | ejemplo | presencial |
| | `ini_ora_ejemplo_ahijados` | ejemplo | presencial |
| | `ini_ora_cuerpo_video` | cuerpo | video |
| orador → guia | `ora_gui_palabra_publico` | palabra | presencial |
| | `ora_gui_ejemplo_celula` | ejemplo | presencial |
| | `ora_gui_cuerpo_video` | cuerpo | video |
| guia → maestro | `gui_mae_palabra_ponencia` | palabra | presencial |
| | `gui_mae_ejemplo_capacitacion` | ejemplo | presencial |
| | `gui_mae_ejemplo_celulas` | ejemplo | presencial |
| | `gui_mae_cuerpo_video` | cuerpo | video |

Reconciliaciones que se hicieron al unificar (la base manda):

- La vieja misión de pantalla «Aprender el lema» no es una misión de la base:
  el lema vive dentro de `asp_ini_ejemplo_aspirante` (traer 1 aspirante y
  enseñarle el lema). Salió de la lista.
- «Registrar tu marca base» eran **dos** misiones en la base y quedaron dos:
  `asp_ini_cuerpo_video` (flexiones y plancha, en casa) y
  `asp_ini_cuerpo_2km` (2 km cronometrados, en la célula).
- El discurso de 5 minutos de Orador es **una sola** misión en la base
  (`ini_ora_palabra_video`: tema sorteado, grabado en una sola toma); la
  versión «en vivo ante la célula» que mostraba la pantalla se fusionó en
  ella. El debate en vivo sigue aparte (`ini_ora_palabra_debate`).
- «Dictar una capacitación completa» es del pilar **ejemplo** en la base
  (`gui_mae_ejemplo_capacitacion`), no de palabra.

## Reglas del sistema que el frontend ya respeta

- El rango inicial es siempre **aspirante**; nadie elige ni se auto-asciende.
- Completar las misiones **habilita** el ascenso; el rango lo **otorga solo
  el Fundador** desde Administración (para arriba y para abajo), vía
  `set_rank`, y cada cambio queda en `rank_history`.
- El Guía **atestigua** envíos (aprueba o devuelve); no cambia rangos.
- Los videos de discurso: **una sola toma, sin cortes ni edición**.
- Ninguna misión pide idiomas: la palabra se entrena en el idioma de cada base.

## Despliegue

Seguir `../backend/SETUP.md` en orden. Carpeta estática: se puede servir tal
cual (GitHub Pages u otro hosting). El logo se referencia como
`../logo/la-voz-logo-v1.png`; si la carpeta se despliega separada de
`hermandad/`, copiar el logo adentro y ajustar la ruta.
