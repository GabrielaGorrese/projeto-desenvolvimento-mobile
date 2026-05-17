import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const FIGMA_WIDTH = 412;
const FIGMA_HEIGHT = 917;

export const scaleW = (value) => (screenWidth / FIGMA_WIDTH) * value;
export const scaleH = (value) => (screenHeight / FIGMA_HEIGHT) * value;

export const loginLayout = {
  topSectionHeight: scaleH(312),
  logoWidth: scaleW(334),
  logoHeight: scaleH(113),
  welcomeMarginTop: scaleH(12),
  bannerHeight: scaleH(121),
  bannerPaddingLeft: scaleW(38),
  backIconSize: scaleW(28),
  formPaddingHorizontal: scaleW(24),
  formPaddingTop: scaleH(28),
  labelFontSize: scaleW(18),
  labelLineHeight: scaleH(27),
  labelToInputGap: scaleH(7),
  fieldGap: scaleH(18),
  beforeEnterGap: scaleH(63),
  enterButtonWidth: scaleW(142),
  enterButtonHeight: scaleH(51),
  enterButtonRadius: scaleW(8),
  beforeRegisterGap: scaleH(14),
  registerButtonWidth: scaleW(122),
  registerButtonHeight: scaleH(38),
  registerButtonRadius: scaleW(8),
  beforeFooterGap: scaleH(73),
  inputHeight: scaleH(38),
  inputRadius: scaleW(8),
  roleFontSize: scaleW(32),
  selectionPromptMarginTop: scaleH(52),
  selectionCardsMarginTop: scaleH(68),
  roleCardWidth: scaleW(336),
  roleCardHeight: scaleH(133),
  roleCardGap: scaleH(24),
  roleCardRadius: scaleW(12),
  roleCardPaddingHorizontal: scaleW(38),
  roleCardTitleSize: scaleW(24),
  roleIllustrationSize: scaleW(124),
  roleIllustrationOffsetLeft: scaleW(-26),
  roleIllustrationOffsetTop: scaleH(4),
  roleTitlePaddingRight: scaleW(40),
};
