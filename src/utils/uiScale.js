const PHONE_REF_WIDTH = 375;
const TABLET_MIN_SIDE = 600;
const TABLET_MAX_SCALE = 1.15;
const TABLET_ROW_MIN_SCALE = 1.15;
const TABLET_ROW_MAX_SCALE = 1.35;

/**
 * Escala de UI para componentes com tamanho fixo (tiles, FAB, bottom bar).
 * Celulares: width / 375 — comportamento original.
 * Tablets: normaliza pelo menor lado e limita para evitar elementos gigantes.
 */
export function getUiScale(width, height = width) {
  const minSide = Math.min(width, height);
  const phoneScale = width / PHONE_REF_WIDTH;

  if (minSide < TABLET_MIN_SIDE) {
    return phoneScale;
  }

  const base = width / minSide;

  const isPortrait = height > width;

  if (isPortrait) {
    return Math.min(base * 3, 2);
  }

  return Math.min(base, TABLET_MAX_SCALE);
}

/**
 * Escala para linhas de lista (PendingOrderRow).
 * Celulares: mantém os clamps originais.
 * Tablets: amplia textos, elementos e botões proporcionalmente.
 */
export function getRowScale(width, height = width) {
  const minSide = Math.min(width, height);
  const scaleRaw = width / PHONE_REF_WIDTH;

  const base = {
    scale: Math.min(Math.max(scaleRaw, 0.75), 1.1),
    textScale: Math.min(Math.max(scaleRaw, 0.7), 1.0),
    btnScale: Math.min(Math.max(scaleRaw, 0.8), 1.05),
  };

  if (minSide < TABLET_MIN_SIDE) {
    return base;
  }

  const tabletBoost = Math.min(
    TABLET_ROW_MAX_SCALE,
    Math.max(TABLET_ROW_MIN_SCALE, (minSide / PHONE_REF_WIDTH) * 0.65),
  );

  return {
    scale: base.scale * tabletBoost,
    textScale: base.textScale * tabletBoost,
    btnScale: base.btnScale * tabletBoost,
  };
}
