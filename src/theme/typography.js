import { Platform } from 'react-native';

const baseFamily = Platform.select({
  ios:     'System',
  android: 'sans-serif',
  default: 'System',
});

export const typography = {
  family:        baseFamily,
  familyBold:    Platform.select({ ios: 'System', android: 'sans-serif-medium' }),
  familyHeavy:   Platform.select({ ios: 'System', android: 'sans-serif-black' }),

  h1:        { fontFamily: baseFamily, fontSize: 32, fontWeight: '900' },
  h2:        { fontFamily: baseFamily, fontSize: 24, fontWeight: '800' },
  h3:        { fontFamily: baseFamily, fontSize: 20, fontWeight: '700' },
  title:     { fontFamily: baseFamily, fontSize: 18, fontWeight: '700' },
  subtitle:  { fontFamily: baseFamily, fontSize: 14, fontWeight: '500' },
  body:      { fontFamily: baseFamily, fontSize: 14, fontWeight: '400' },
  bodyBold:  { fontFamily: baseFamily, fontSize: 14, fontWeight: '700' },
  caption:   { fontFamily: baseFamily, fontSize: 12, fontWeight: '400' },
  button:    { fontFamily: baseFamily, fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
};

export default typography;
