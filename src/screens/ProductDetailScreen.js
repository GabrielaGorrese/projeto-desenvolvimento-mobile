import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Screen from '../components/Screen';
import Input from '../components/Input';
import Button from '../components/Button';
import { colors, radii, typography } from '../theme';
import {
  fetchProduct,
  saveProduct,
  deleteProduct,
  fetchCategories,
} from '../services/productsService';
import useResponsive from '../hooks/useResponsive';


export default function ProductDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const r = useResponsive();
  const [product,    setProduct]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [categories, setCategories] = useState([]);
  const [showCatPicker, setShowCatPicker] = useState(false);

  const [name,        setName]        = useState('');
  const [categoryId,  setCategoryId]  = useState(null);
  const [price,       setPrice]       = useState('');
  const [description, setDescription] = useState('');
  // imageUri: arquivo NOVO escolhido na galeria (file:// local)
  // imageUrl: URL externa (carregada do servidor ou digitada pelo usuário)
  // originalImage: estado inicial, usado para detectar mudança ao salvar
  const [imageUri,      setImageUri]      = useState(null);
  const [imageUrl,      setImageUrl]      = useState('');
  const [originalImage, setOriginalImage] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [p, cats] = await Promise.all([
          fetchProduct(id),
          fetchCategories(),
        ]);
        setProduct(p);
        setCategories(cats);
        setName(p.name);
        setCategoryId(p.category_id);
        setPrice(String(p.price).replace('.', ','));
        setDescription(p.description || '');
        // p.image vem como URL completa (do upload ou externa) ou null
        setImageUrl(p.image || '');
        setOriginalImage(p.image || '');
      } catch (err) {
        Alert.alert('Erro', err?.uiMessage || 'Erro ao carregar produto.');
        navigation.goBack();
      } finally { setLoading(false); }
    })();
  }, [id, navigation]);

  async function pickImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
    });
    if (!res.canceled) {
      setImageUri(res.assets[0].uri);
      setImageUrl(''); // limpa URL ao escolher arquivo
    }
  }

  async function onSave() {
    if (!name.trim() || !price || !categoryId) {
      Alert.alert('Atenção', 'Preencha nome, preço e categoria.');
      return;
    }
    const parsedPrice = Number(price.replace(',', '.'));
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      Alert.alert('Atenção', 'Preço inválido.');
      return;
    }
    setSaving(true);
    try {
      // Decide o que enviar para o servidor:
      //  - Se há imageUri novo (arquivo escolhido na galeria) → upload
      //  - Senão se a URL mudou em relação ao original → envia image_url
      //  - Senão → nada (mantém imagem atual)
      let imageUrlPayload;
      if (!imageUri && imageUrl !== originalImage) {
        imageUrlPayload = imageUrl;
      }

      await saveProduct({
        id,
        name, description,
        price: parsedPrice,
        category_id: categoryId,
        imageUri,
        imageUrl: imageUrlPayload,
      });
      Alert.alert('Sucesso', 'Produto atualizado.');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Erro', err?.uiMessage || 'Erro ao salvar.');
    } finally { setSaving(false); }
  }

  function onDelete() {
    Alert.alert('Excluir produto?', 'Esta ação irá desativar o produto.', [
      { text: 'Cancelar' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteProduct(id);
            navigation.goBack();
          } catch (err) {
            Alert.alert('Erro', err?.uiMessage || 'Erro ao excluir.');
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <Screen background={colors.bgScreen}>
        <ActivityIndicator style={{ marginTop: 80 }} color={colors.primary} />
      </Screen>
    );
  }

  const catName = categories.find((c) => c.id === categoryId)?.name || '';

  return (
    <Screen background="#FFF" statusBarBg={colors.manager} statusBarStyle="light-content" keyboardOffset={10}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.headerBack}>
          <Feather name="arrow-left" size={22} color="#FFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Visualizar produto</Text>
        <Pressable onPress={onDelete} hitSlop={10} style={styles.headerBack}>
          <Feather name="trash-2" size={20} color="#FFF" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 50, alignItems: 'center' }} keyboardShouldPersistTaps="handled">
        <View style={{ width: '100%', maxWidth: r.contentMaxWidth }}>
        <FieldRow label="Nome">
          <Input value={name} onChangeText={setName} style={{ flex: 1, marginBottom: 0 }} />
        </FieldRow>

        <FieldRow label="Categoria">
          <Pressable
            onPress={() => setShowCatPicker((v) => !v)}
            style={[styles.catChip, { backgroundColor: colors.manager }]}
          >
            <Text style={styles.catChipText}>{(catName || '').toUpperCase() || 'SELECIONAR'}</Text>
          </Pressable>
        </FieldRow>
        {showCatPicker ? (
          <View style={styles.catList}>
            <ScrollView
              style={{ maxHeight: 240 }}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              {categories.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => { setCategoryId(c.id); setShowCatPicker(false); }}
                  android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
                  style={styles.catOpt}
                >
                  <Text style={{ color: colors.textDark }}>{c.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        <FieldRow label="Preço">
          <Input value={price} onChangeText={setPrice} keyboardType="decimal-pad" style={{ flex: 1, marginBottom: 0 }} />
        </FieldRow>

        <FieldRow label="Descrição">
          <Input value={description} onChangeText={setDescription} multiline style={{ flex: 1, marginBottom: 0 }} />
        </FieldRow>

        <FieldRow label="Imagem" stack>
          <Pressable onPress={pickImage} style={styles.imageBox}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%', borderRadius: radii.md }} />
            ) : imageUrl && /^https?:\/\//i.test(imageUrl) ? (
              <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%', borderRadius: radii.md }} />
            ) : (
              <Feather name="plus" size={26} color="#888" />
            )}
          </Pressable>
          <Input
            value={imageUrl}
            onChangeText={(t) => { setImageUrl(t); if (t) setImageUri(null); }}
            placeholder="Ou cole uma URL"
            keyboardType="url"
            autoCapitalize="none"
            style={{ marginTop: 8, marginBottom: 0 }}
          />
        </FieldRow>

        <View style={{ marginTop: 26 }}>
          <Button title="Salvar" onPress={onSave} loading={saving} />
        </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

function FieldRow({ label, children, stack }) {
  return (
    <View style={[styles.fieldRow, stack && { alignItems: 'flex-start' }]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={{ flex: 1, marginLeft: 14 }}>{children}</View>
      <Pressable hitSlop={8} style={styles.editBtn}>
        <Feather name="edit-2" size={14} color="#FFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.manager,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBack:  { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },

  fieldRow:    {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E9E2',
  },
  fieldLabel:  { width: 78, color: colors.textDark, fontWeight: '700', fontSize: 14 },

  catChip:     { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6, alignSelf: 'flex-start' },
  catChipText: { color: '#FFF', fontWeight: '800', fontSize: 12, letterSpacing: 0.6 },
  catList:     { marginTop: 6, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: radii.md, backgroundColor: '#FFF', overflow: 'hidden' },
  catOpt:      { padding: 12, borderBottomWidth: 1, borderBottomColor: '#F2F2F2' },

  imageBox:    {
    width: 110, height: 110, backgroundColor: '#F2F2F2',
    borderRadius: radii.md, alignItems: 'center', justifyContent: 'center',
  },
  editBtn: {
    width: 26, height: 26, borderRadius: 6, marginLeft: 8,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
});
