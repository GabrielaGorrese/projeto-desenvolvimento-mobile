import { useWindowDimensions } from 'react-native';

// Hook único para decisões de layout responsivo.
// Atualiza em mudança de orientação automaticamente.
//
// Convenções:
//   - phone:   menor lado < 480
//   - tablet:  menor lado >= 600
//   - landscape: width > height
//
// Use em componentes:
//   const r = useResponsive();
//   if (r.isLandscape) { ... }
export default function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const minSide     = Math.min(width, height);
  const isTablet    = minSide >= 600;
  const isPhone     = !isTablet;

  // Larguras úteis para conteúdo (centralizado quando a tela é larga)
  const contentMaxWidth =
      width >= 1200 ? 1400
    : width >=  900 ? 760
    : width >=  600 ? 560
    : width;

  // Colunas sugeridas em grids
  const cols = (target) => {
    // target é a largura ideal de cada célula em dp
    const c = Math.max(1, Math.floor(width / target));
    return c;
  };

  return {
    width,
    height,
    isLandscape,
    isPortrait: !isLandscape,
    isTablet,
    isPhone,
    contentMaxWidth,
    cols,
  };
}
