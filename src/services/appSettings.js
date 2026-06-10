import AsyncStorage from '@react-native-async-storage/async-storage';

// Flags de recursos opcionais da comanda. Ficam desligadas por padrão — os
// campos (Mesa / Identificação) continuam no código, só não aparecem no front
// até serem reativados aqui. Persistidas no aparelho.
const KEY_TABLE = '@comandou:showTable';
const KEY_LABEL = '@comandou:showLabel';

let _showTable = false;
let _showLabel = false;

export async function loadAppSettings() {
  try {
    const [t, l] = await Promise.all([
      AsyncStorage.getItem(KEY_TABLE),
      AsyncStorage.getItem(KEY_LABEL),
    ]);
    _showTable = t === 'true';
    _showLabel = l === 'true';
  } catch {
    _showTable = false;
    _showLabel = false;
  }
}

export function getShowTable() { return _showTable; }
export function getShowLabel() { return _showLabel; }

export async function setShowTable(v) {
  _showTable = !!v;
  await AsyncStorage.setItem(KEY_TABLE, _showTable ? 'true' : 'false');
}
export async function setShowLabel(v) {
  _showLabel = !!v;
  await AsyncStorage.setItem(KEY_LABEL, _showLabel ? 'true' : 'false');
}
