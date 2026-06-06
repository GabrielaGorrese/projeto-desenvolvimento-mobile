import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import ScrollFade from '../components/ScrollFade';
import { Feather } from '@expo/vector-icons';
import useImagePicker from '../hooks/useImagePicker';
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
  const pickImage = useImagePicker();

  const [categories,    setCategories]    = useState([]);
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [name,          setName]          = useState('');
  const [categoryId,    setCategoryId]    = useState(null);
  const [price,         setPrice]         = useState('');
  const [description,   setDescription]   = useState('');
  const [imageUri,      setImageUri]      = useState(null);
  const [imageUrl,      setImageUrl]      = useState('');
  const [saving,        setSaving]        = useState(false);
  const [success,       setSuccess]       = useState(false);
  const [errorModal,    setErrorModal]    = useState(null);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
  }, []);

  async function handlePickImage() {
    const uri = await pickImage();
    if (uri) { setImageUri(uri); setImageUrl(''); }
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
        imageUrl: !imageUri && imageUrl.trim() ? imageUrl.trim() : undefined,
      });
      setSuccess(true);
    } catch (err) {
      setErrorModal({ title: 'Erro', message: err?.uiMessage || 'Erro ao cadastrar.' });
    } finally { setSaving(false); }
  }

  const catName  = categories.find((c) => c.id === categoryId)?.name;
  const hasImage = imageUri || (imageUrl && /^https?:\/\//i.test(imageUrl));
  const imgSrc   = imageUri ? { uri: imageUri } : { uri: imageUrl };

  // Em paisagem a caixa de imagem fica menor para não dominar a tela
  const imageBoxH = r.isLandscape ? 170 : 250;

  // Tamanhos de input maiores para uso confortável em tablet
  const inputField = { height: 70, paddingHorizontal: 20 };
  const inputText  = { fontSize: 22 };
  const multiField = { minHeight: 140, paddingHorizontal: 20, paddingVertical: 16 };

  return (
    <Screen background="#FFF" statusBarBg={colors.bgDark} statusBarStyle="light-content" keyboardOffset={10}>
      <DarkHeader
        title={editingId ? 'Editar produto' : 'Novo produto'}
        subtitle="Cadastro de novo produto"
        onBack={() => navigation.goBack()}
      />
      <ScrollFade
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 28, paddingBottom: 80, alignItems: 'center' }}
        keyboardShouldPersistTaps="handled"
        fadeColor="#FFF"
      >
        <View style={{ width: '100%', maxWidth: r.contentMaxWidth }}>

          <LabeledInput label="Nome:">
            <Input value={name} onChangeText={setName} fieldStyle={inputField} inputStyle={inputText} style={{ marginBottom: 0 }} />
          </LabeledInput>

          <LabeledInput label="Categoria:">
            <Pressable
              onPress={() => setShowCatPicker((v) => !v)}
              style={styles.catSelect}
            >
              <Text style={[styles.catText, !catName && { color: colors.textMuted }]}>
                {catName || 'Selecionar...'}
              </Text>
              <Feather name="chevron-down" size={22} color={colors.textMuted} />
            </Pressable>
            {showCatPicker ? (
              <View style={styles.catList}>
                <ScrollView style={{ maxHeight: 240 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                  {categories.map((c) => (
                    <Pressable
                      key={c.id}
                      onPress={() => { setCategoryId(c.id); setShowCatPicker(false); }}
                      android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
                      style={styles.catOpt}
                    >
                      <Text style={styles.catOptText}>{c.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}
          </LabeledInput>

          <LabeledInput label="Preço:">
            <Input
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              placeholder="0,00"
              fieldStyle={inputField}
              inputStyle={inputText}
              style={{ marginBottom: 0 }}
            />
          </LabeledInput>

          <LabeledInput label="Descrição:">
            <Input
              value={description}
              onChangeText={setDescription}
              multiline
              fieldStyle={multiField}
              inputStyle={inputText}
              style={{ marginBottom: 0 }}
            />
          </LabeledInput>

          
          <Text style={styles.imgLabel}>Imagem:</Text>

         
          <View style={r.isLandscape ? styles.imageRowLandscape : null}>

            {/* Caixa de seleção de imagem */}
            <Pressable
              onPress={handlePickImage}
              style={[
                styles.imageBox,
                { height: imageBoxH },
                r.isLandscape ? { flex: 1, marginRight: 16 } : { width: '100%' },
              ]}
            >
              {hasImage ? (
                <>
                  <Image
                    source={imgSrc}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                  
                  <View style={styles.imageOverlay}>
                    <Feather name="camera" size={18} color="#FFF" />
                    <Text style={styles.imageOverlayText}>Trocar foto</Text>
                  </View>
                </>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Feather name="image" size={40} color="#AAA" />
                  <Text style={styles.imagePlaceholderText}>Selecionar foto</Text>
                </View>
              )}
            </Pressable>

            {/* Separador + campo de URL */}
            <View style={r.isLandscape ? { flex: 1, justifyContent: 'center' } : null}>
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
                fieldStyle={inputField}
                inputStyle={inputText}
                style={{ marginBottom: 0 }}
              />
            </View>
          </View>

          <View style={{ marginTop: 32 }}>
            <Button title={editingId ? 'Salvar' : 'Cadastrar'} onPress={onSubmit} loading={saving} />
          </View>
        </View>
      </ScrollFade>

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
    <View style={{ marginBottom: 30 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldLabel: { ...typography.bodyBold, color: colors.textDark, fontSize: 23, marginBottom: 12 },

  catSelect: {
    height: 70,
    backgroundColor: colors.inputBg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  catText:    { color: colors.textDark, fontSize: 22 },
  catList:    { marginTop: 8, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: radii.md, backgroundColor: '#FFF', overflow: 'hidden' },
  catOpt:     { padding: 20, borderBottomWidth: 1, borderBottomColor: '#F2F2F2' },
  catOptText: { color: colors.textDark, fontSize: 20 },

  imgLabel: { ...typography.bodyBold, color: colors.textDark, fontSize: 23, marginBottom: 14 },

  // Em landscape, picker e URL ficam lado a lado
  imageRowLandscape: { flexDirection: 'row', alignItems: 'flex-start' },

  imageBox: {
    backgroundColor: colors.inputBg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },

  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    rowGap: 8,
  },
  imagePlaceholderText: { color: '#AAA', fontSize: 17, marginTop: 8 },

  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 44,
    backgroundColor: 'rgba(0,0,0,0.45)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 6,
  },
  imageOverlayText: { color: '#FFF', fontWeight: '700', fontSize: 17 },

  orSeparator: { flexDirection: 'row', alignItems: 'center', marginVertical: 18 },
  orLine:      { flex: 1, height: 1, backgroundColor: colors.inputBorder },
  orText:      { marginHorizontal: 12, color: colors.textMuted, fontSize: 16 },
});
