/* ============================================================================
   LA VOZ — Configuración del backend (Supabase)
   ----------------------------------------------------------------------------
   INSTRUCCIONES: reemplazar los dos valores de abajo por los del proyecto
   Supabase real (Panel de Supabase → Settings → API):
     · SUPABASE_URL       → "Project URL"
     · SUPABASE_ANON_KEY  → "anon public" key
   Mientras los valores sean los de ejemplo, la app corre en MODO DEMOSTRACIÓN:
   no habla con ningún servidor y el panel se previsualiza con datos de prueba.
   La clave "anon" es pública por diseño: la seguridad real la dan las
   políticas RLS y las funciones del paquete de backend, no esta clave.
   ========================================================================== */

const SUPABASE_URL = "https://kgphnxetehgtlrjyvhmg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtncGhueGV0ZWhndGxyanl2aG1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3NjcwNDYsImV4cCI6MjEwNzM0MzA0Nn0.DvYJ2m0UJvyZGMaS0JhXnQMcWy2Trm6Hfq-hsmYrK6g";

/* ¿Ya se cargaron credenciales reales? */
const BACKEND_ACTIVO =
  !SUPABASE_URL.includes("TU-PROYECTO") && SUPABASE_ANON_KEY !== "TU_ANON_KEY";

let _supabaseClient = null;

/* Devuelve el cliente de Supabase (o null en modo demostración). */
function getSupabase() {
  if (!BACKEND_ACTIVO) return null;
  if (!_supabaseClient) {
    _supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _supabaseClient;
}

/* Nombres de objetos del backend — fuente de verdad: ../backend/schema.sql
   y ../backend/storage.sql. NO renombrar acá sin cambiar la base:
   · Tabla  profiles      — un registro por miembro (full_name, lvz_code,
                            rank, cell_id, status); rank es el enum del
                            backend: aspirante|iniciado|orador|guia|maestro|fundador
   · Tabla  cells         — células (name, city, country, meeting_place,
                            meeting_day, guide_id)
   · Tabla  missions      — las 17 misiones semilla (key, from_rank, to_rank,
                            pillar, kind, title, rubric)
   · Tabla  submissions   — envíos de misiones (user_id, mission_key,
                            storage_path, status, reviewed_by, reviewed_at)
   · Tabla  rank_history  — bitácora de cambios de rango (solo lectura)
   · Bucket de Storage "videos" — privado; ruta {user_id}/{mission_key}/{archivo}
   · RPC    set_rank(target_user, new_rank, note) — SOLO el Fundador
   · RPC    set_member_status(target_user, new_status) — SOLO el Fundador
   · Trigger handle_new_user — al registrarse crea el profile como Aspirante
     con su número LVZ correlativo (nadie se asigna rango desde el frontend)
*/
const TABLA_PROFILES = "profiles";
const TABLA_CELLS = "cells";
const TABLA_MISSIONS = "missions";
const TABLA_SUBMISSIONS = "submissions";
const TABLA_RANK_HISTORY = "rank_history";
const TABLA_DOCUMENTS = "documents";
const TABLA_CELL_APPLICATIONS = "cell_applications";
const BUCKET_VIDEOS = "videos";
const BUCKET_DOCUMENTOS = "documentos";
