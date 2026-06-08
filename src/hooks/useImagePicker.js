import * as ImagePicker from 'expo-image-picker';

export default function useImagePicker({
  quality = 0.8,
  allowsEditing = true,
} = {}) {
  return async function pick() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return null;

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality,
      allowsEditing,
    });

    return res.canceled ? null : res.assets[0].uri;
  };
}
