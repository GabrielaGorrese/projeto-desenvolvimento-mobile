import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Screen from '../components/Screen';
import DarkHeader from '../components/DarkHeader';
import Input from '../components/Input';
import Button from '../components/Button';
import FeedbackModal from '../components/FeedbackModal';
import { colors, radii, typography } from '../theme';
import { fetchCategories, saveProduct } from '../services/productsService';
import useResponsive from '../hooks/useResponsive';


export default function NewProductScreen({ navigation, route }) {
  const editingId = route.params?.id && route.params.id !== 'new' ? route.params.id : null;
  const r = useResponsive();
  const [categories, setCategories] = useState([]);
  const [showCatPicker, setShowCatPicker] = useState(false);

  const [name,        setName]        = useState('');
  const [categoryId,  setCategoryId]  = useState(null);
  const [price,       setPrice]       = useState('');
  const [description, setDescription] = useState('');
  const [imageUri,    setImageUri]    = useState(null);   // arquivo da galeria
  const [imageUrl,    setImageUrl]    = useState('');     // URL externa
  const [saving,      setSaving]      = useState(false);
  const [success,     setSuccess]     = useState(false);
  const [errorModal,  setErrorModal]  = useState(null); // { title, message }

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
  }, []);

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
      setImageUrl(''); // selecionar arquivo limpa o campo URL
    }
  }

  async function onSubmit() {
    if (!name.trim() || !price || !categoryId) {
      setErrorModal({ title: 'Atenção', message: 'Preencha nome, categoria e preço.' });
      return;
    }
    const parsedPrice = Number(price.replace(',', '.'));
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setErrorModal({ title: 'Atenção', message: 'Preço inválido.' });
      return;
    }
    setSaving(true);
    try {
      await saveProduct({
        id: editingId,
        name, description,
        price: parsedPrice,
        category_id: categoryId,
        imageUri,
        // Se o usuário não selecionou arquivo mas digitou URL, manda imageUrl.
        imageUrl: !imageUri && imageUrl.trim() ? imageUrl.trim() : undefined,
      });
      setSuccess(true);
    } catch (err) {
      setErrorModal({ title: 'Erro', message: err?.uiMessage || 'Erro ao cadastrar.' });
    } finally { setSaving(false); }
  }

  const catName = categories.find((c) => c.id === categoryId)?.name;

  return (
    <Screen background="#FFF" statusBarBg={colors.bgDark} statusBarStyle="light-content" keyboardOffset={10}>
      <DarkHeader
        title={editingId ? 'Editar produto' : 'Novo produto'}
        subtitle="Cadastro de novo produto"
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 60, alignItems: 'center' }} keyboardShouldPersistTaps="handled">
        <View style={{ width: '100%', maxWidth: r.contentMaxWidth }}>
        <LabeledInput label="Nome:">
          <Input value={name} onChangeText={setName} style={{ marginBottom: 0 }} />
        </LabeledInput>

        <LabeledInput label="Categoria:">
          <Pressable onPress={() => setShowCatPicker((v) => !v)} style={styles.catSelect}>
            <Text style={[styles.catText, !catName && { color: colors.textMuted }]}>
              {catName || 'Selecionar...'}
            </Text>
            <Feather name="chevron-down" size={16} color={colors.textMuted} />
          </Pressable>
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
        </LabeledInput>

        <LabeledInput label="Preço:">
          <Input value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="0,00" style={{ marginBottom: 0 }} />
        </LabeledInput>

        <LabeledInput label="Descrição:">
          <Input value={description} onChangeText={setDescription} multiline style={{ marginBottom: 0 }} />
        </LabeledInput>

        <Text style={styles.imgLabel}>Imagem:</Text>
        <Pressable onPress={pickImage} style={styles.imageBox}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%', borderRadius: radii.md }} />
          ) : imageUrl && /^https?:\/\//i.test(imageUrl) ? (
            <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%', borderRadius: radii.md }} />
          ) : (
            <View style={styles.imageIcon}>
              <Feather name="plus" size={26} color="#666" />
            </View>
          )}
        </Pressable>

        <View style={styles.orSeparator}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>ou cole uma URL</Text>
          <View style={styles.orLine} />
        </View>

        <Input
          value={imageUrl}
          onChangeText={(t) => { setImageUrl(t); if (t) setImageUri(null); }}
          placeholder="https://exemplo.com/imagem.jpg"
          keyboardType="url"
          autoCapitalize="none"
          style={{ marginBottom: 0 }}
        />

        <View style={{ marginTop: 28 }}>
          <Button title="Cadastrar" onPress={onSubmit} loading={saving} />
        </View>
        </View>
      </ScrollView>

      <FeedbackModal
        visible={success}
        title="Produto cadastrado"
        message={`Produto "${name}" cadastrado com sucesso!`}
        onClose={() => { setSuccess(false); navigation.goBack(); }}
      />

      <FeedbackModal
        visible={!!errorModal}
        variant="danger"
        title={errorModal?.title || 'Erro'}
        message={errorModal?.message || ''}
        okLabel="OK"
        onClose={() => setErrorModal(null)}
      />
    </Screen>
  );
}

function LabeledInput({ label, children }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldLabel: { ...typography.bodyBold, color: colors.textDark, fontSize: 15, marginBottom: 6 },

  catSelect: {
    height: 46,
    backgroundColor: colors.inputBg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  catText: { color: colors.textDark, fontSize: 15 },
  catList: {
    marginTop: 6,
    borderWidth: 1, borderColor: colors.inputBorder, borderRadius: radii.md, backgroundColor: '#FFF',
    overflow: 'hidden',
  },
  catOpt: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#F2F2F2' },

  imgLabel: { ...typography.bodyBold, color: colors.textDark, fontSize: 15, marginBottom: 6 },
  imageBox: {
    width: '100%',
    height: 200,
    backgroundColor: colors.inputBg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imageIcon: {
    width: 40, height: 40, borderRadius: 6, backgroundColor: '#E2E2E2',
    alignItems: 'center', justifyContent: 'center',
  },

  // Separador "── ou cole uma URL ──" entre o picker e o input de URL
  orSeparator: { flexDirection: 'row', alignItems: 'center', marginVertical: 14 },
  orLine:      { flex: 1, height: 1, backgroundColor: colors.inputBorder },
  orText:      { marginHorizontal: 10, color: colors.textMuted, fontSize: 12 },
});
