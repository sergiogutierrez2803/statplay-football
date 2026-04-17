/**
 * Servicios de validación para la tabla `equipos`.
 * - Validaciones no destructivas: loguear y "skip" en caso conflictivo
 * - Reutiliza `normalizeName` de `teamLogoMap` si está disponible
 */

const pool = require('../db');

let normalizeName;
try {
  normalizeName = require('../teamLogoMap').normalizeName;
} catch (e) {
  // Fallback simple y seguro
  normalizeName = (s) => {
    if (!s) return '';
    return String(s)
      .toLowerCase()
      .replace(/\b(fc|cf|ac|as|ss|us|cd|rc|ud|sd|rcd|afc|sc|vfl|vfb|fsv|rb)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  };
}

async function normalizeLegacyEquipo(equipo) {
  const normalized = { ...equipo };
  const warnings = [];

  if (normalized.fuente === 'legacy') {
    normalized.fd_id = null;
    normalized.short_name = null;
    warnings.push('legacy: normalizado fd_id=null y short_name=null');
  }

  return { normalized, warnings };
}

async function findDuplicateFdId(fd_id, excludeId = null) {
  if (!fd_id) return null;

  try {
    const sql = excludeId
      ? 'SELECT id, fuente, liga_id, nombre FROM equipos WHERE fd_id = ? AND id <> ? LIMIT 1'
      : 'SELECT id, fuente, liga_id, nombre FROM equipos WHERE fd_id = ? LIMIT 1';

    const params = excludeId ? [fd_id, excludeId] : [fd_id];
    const [rows] = await pool.query(sql, params);
    return rows[0] || null;
  } catch (e) {
    console.warn('[EquiposService] findDuplicateFdId error:', e.message);
    return null;
  }
}

async function findDuplicateShortName(short_name, liga_id, excludeId = null) {
  if (!short_name || !liga_id) return null;

  try {
    const sql = excludeId
      ? 'SELECT id, fuente, short_name FROM equipos WHERE liga_id = ? AND short_name IS NOT NULL AND LOWER(short_name) = LOWER(?) AND id <> ? LIMIT 1'
      : 'SELECT id, fuente, short_name FROM equipos WHERE liga_id = ? AND short_name IS NOT NULL AND LOWER(short_name) = LOWER(?) LIMIT 1';

    const params = excludeId ? [liga_id, short_name, excludeId] : [liga_id, short_name];
    const [rows] = await pool.query(sql, params);
    return rows[0] || null;
  } catch (e) {
    console.warn('[EquiposService] findDuplicateShortName error:', e.message);
    return null;
  }
}

function compareNames(nombre, nombre_fd) {
  const n1 = normalizeName(nombre || '');
  const n2 = normalizeName(nombre_fd || '');

  if (!n1 || !n2) return { equal: false, score: 0, n1, n2 };
  if (n1 === n2) return { equal: true, score: 1, n1, n2 };

  const a = new Set(n1.split(' ').filter(Boolean));
  const b = new Set(n2.split(' ').filter(Boolean));
  const inter = [...a].filter((x) => b.has(x)).length;
  const union = new Set([...a, ...b]).size || 1;
  const score = inter / union;

  return { equal: false, score, n1, n2 };
}

/**
 * validateEquipoBeforeSave
 * - No aplica cambios destructivos; devuelve normalizedEquipo y warnings/errors
 * - Política actual:
 *   - legacy -> fd_id=null, short_name=null
 *   - fd_id duplicado -> warning + skip fd_id assignment
 *   - short_name duplicado en fila no-legacy -> warning + skip short_name assignment
 */
async function validateEquipoBeforeSave(equipo, { excludeId = null } = {}) {
  const errors = [];
  const warnings = [];
  let normalizedEquipo = { ...equipo };

  // Si no viene liga_id y sí excludeId, intentar recuperarlo
  if (!normalizedEquipo.liga_id && excludeId) {
    try {
      const [r] = await pool.query(
        'SELECT liga_id FROM equipos WHERE id = ? LIMIT 1',
        [excludeId]
      );
      if (r && r[0] && r[0].liga_id) {
        normalizedEquipo.liga_id = r[0].liga_id;
      }
    } catch (e) {
      // ignorar
    }
  }

  // 1) Normalización legacy
  if (normalizedEquipo.fuente === 'legacy') {
    normalizedEquipo.fd_id = null;
    normalizedEquipo.short_name = null;
    warnings.push('legacy: normalized fd_id y short_name a NULL');
  }

  // 2) Duplicado de fd_id
  if (normalizedEquipo.fd_id) {
    try {
      const dup = await findDuplicateFdId(normalizedEquipo.fd_id, excludeId);
      if (dup) {
        warnings.push(
          `fd_id ${normalizedEquipo.fd_id} ya existe en equipos.id=${dup.id} (fuente=${dup.fuente}) — no asignado`
        );
        // Se omite la asignación para que el caller conserve el valor actual con COALESCE
        normalizedEquipo.fd_id = null;
      }
    } catch (e) {
      console.warn('[EquiposService] fd_id check error:', e.message);
    }
  }

  // 3) Duplicado de short_name dentro de la liga
  if (normalizedEquipo.short_name && normalizedEquipo.liga_id) {
    try {
      const dup = await findDuplicateShortName(
        normalizedEquipo.short_name,
        normalizedEquipo.liga_id,
        excludeId
      );

      if (dup && dup.fuente && dup.fuente !== 'legacy') {
        warnings.push(
          `short_name "${normalizedEquipo.short_name}" duplicado en equipos.id=${dup.id} (fuente=${dup.fuente}) — no sobrescribir`
        );
        normalizedEquipo.short_name = null;
      }
    } catch (e) {
      console.warn('[EquiposService] short_name check error:', e.message);
    }
  }

  // 4) Sanity check nombre vs nombre_fd
  if (normalizedEquipo.nombre && normalizedEquipo.nombre_fd) {
    try {
      const cmp = compareNames(normalizedEquipo.nombre, normalizedEquipo.nombre_fd);
      if (!cmp.equal && cmp.score < 0.45) {
        warnings.push(
          `nombre mismatch posible (score=${cmp.score.toFixed(2)}): "${cmp.n1}" vs "${cmp.n2}"`
        );
      }
    } catch (e) {
      // ignorar
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    normalizedEquipo,
  };
}

module.exports = {
  normalizeLegacyEquipo,
  findDuplicateFdId,
  findDuplicateShortName,
  compareNames,
  validateEquipoBeforeSave,
};