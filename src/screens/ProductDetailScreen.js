import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import useImagePicker from '../hooks/useImagePicker';
import Input from '../components/Input';
import Button from '../components/Button';
import FeedbackModal from '../components/FeedbackModal';
import ConfirmModal from '../components/ConfirmModal';
import { colors, radii } from '../theme';
import {
  fetchProduct,
  saveProduct,
  deleteProduct,
  fetchCategories,
} from '../services/productsService';
import useResponsive from '../hooks/useResponsive';


export default function ProductDetailScreen({ route, navigation }) {
  const { id }           = route.params;
  const r                = useResponsive();
  const { height: winH } = useWindowDimensions();
  const pickImage        = useImagePicker();

  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [categories,    setCategories]    = useState([]);
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [feedback,      setFeedback]      = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting,      setDeleting]      = useState(false);

  const [name,          setName]          = useState('');
  const [categoryId,    setCategoryId]    = useState(null);
  const [price,         setPrice]         = useState('');
  const [description,   setDescription]   = useState('');
  const [imageUri,      setImageUri]      = useState(null);
  const [imageUrl,      setImageUrl]      = useState('');
  const [originalImage, setOriginalImage] = useState('');

  
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const dialogScale  = useRef(new Animated.Value(0.94)).current;
  const dialogSlide  = useRef(new Animated.Value(28)).current;
  const dialogAlpha  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 1, duration: 240, useNativeDriver: true }),
      Animated.spring(dialogScale,  { toValue: 1, damping: 18, stiffness: 220, useNativeDriver: true }),
      Animated.timing(dialogSlide,  { toValue: 0, duration: 260, useNativeDriver: true }),
      Animated.timing(dialogAlpha,  { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  function handleClose() {
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(dialogScale,  { toValue: 0.94, duration: 160, useNativeDriver: true }),
      Animated.timing(dialogSlide,  { toValue: 16, duration: 160, useNativeDriver: true }),
      Animated.timing(dialogAlpha,  { toValue: 0, duration: 160, useNativeDriver: true }),
    ]).start(() => navigation.goBack());
  }


  const [kbHeight, setKbHeight] = useState(0);
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const s = Keyboard.addListener('keyboardWillShow', (e) => setKbHeight(e.endCoordinates?.height || 0));
    const h = Keyboard.addListener('keyboardWillHide', () => setKbHeight(0));
    return () => { s.remove(); h.remove(); };
  }, []);

  const [scrollFade, setScrollFade] = useState(false);
  const scrollViewH    = useRef(0);
  const scrollContentH = useRef(0);
  function recheckFade() {
    setScrollFade(scrollContentH.current > scrollViewH.current + 10);
  }

  const scrollRef      = useRef(null);
  const fieldPositions = useRef({});
  function onFieldLayout(key, e) { fieldPositions.current[key] = e.nativeEvent.layout.y; }
  function scrollToField(key) {
    const y = fieldPositions.current[key];
    if (y == null) return;
    setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(0, y - 20), animated: true }), 300);
  }


  useEffect(() => {
    (async () => {
      try {
        const [p, cats] = await Promise.all([fetchProduct(id), fetchCategories()]);
        setCategories(cats);
        setName(p.name);
        setCategoryId(p.category_id);
        setPrice(String(p.price).replace('.', ','));
        setDescription(p.description || '');
        setImageUrl(p.image || '');
        setOriginalImage(p.image || '');
      } catch (err) {
        setFeedback({ variant: 'danger', title: 'Erro', message: err?.uiMessage || 'Erro ao carregar produto.', onClose: handleClose });
      } finally { setLoading(false); }
    })();
  }, [id]);

  async function handlePickImage() {
    const uri = await pickImage();
    if (uri) { setImageUri(uri); setImageUrl(''); }
  }

  async function onSave() {
    if (!name.trim() || !price || !categoryId) {
      setFeedback({ variant: 'danger', title: 'Atenção', message: 'Preencha nome, preço e categoria.' });
      return;
    }
    const parsedPrice = Number(price.replace(',', '.'));
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setFeedback({ variant: 'danger', title: 'Atenção', message: 'Preço inválido.' });
      return;
    }
    setSaving(true);
    try {
      let imageUrlPayload;
      if (!imageUri && imageUrl !== originalImage) imageUrlPayload = imageUrl;
      await saveProduct({ id, name, description, price: parsedPrice, category_id: categoryId, imageUri, imageUrl: imageUrlPayload });
      setFeedback({ variant: 'success', title: 'Produto atualizado', message: 'Alterações salvas com sucesso!', onClose: handleClose });
    } catch (err) {
      setFeedback({ variant: 'danger', title: 'Erro', message: err?.uiMessage || 'Erro ao salvar.' });
    } finally { setSaving(false); }
  }

  async function doDelete() {
    try {
      setDeleting(true);
      await deleteProduct(id);
      setConfirmDelete(false);
      handleClose();
    } catch (err) {
      setConfirmDelete(false);
      setFeedback({ variant: 'danger', title: 'Erro', message: err?.uiMessage || 'Erro ao excluir.' });
    } finally { setDeleting(false); }
  }

  const catName = categories.find((c) => c.id === categoryId)?.name || '';
  const fld  = { height: 68, paddingHorizontal: 18 };
  const txt  = { fontSize: 21 };
  const mFld = { minHeight: 130, paddingHorizontal: 18, paddingVertical: 14 };

  
  const overlayPadBottom = Platform.OS === 'ios' ? kbHeight : 0;
  const dialogMaxH = Math.min((winH - overlayPadBottom) * 0.96, 940);
  const dialogW    = Math.min(r.width * 0.92, 860);

  return (
    <View style={{ flex: 1 }}>


      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: 'rgba(0,0,0,0.60)', opacity: backdropAnim },
        ]}
      />

      <Pressable style={StyleSheet.absoluteFillObject} onPress={handleClose} />


      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: overlayPadBottom }}
        pointerEvents="box-none"
      >

        <Animated.View
          style={[
            styles.dialog,
            { maxHeight: dialogMaxH, width: dialogW },
            {
              opacity: dialogAlpha,
              transform: [
                { scale: dialogScale },
                { translateY: dialogSlide },
              ],
            },
          ]}
          onStartShouldSetResponder={() => true}
        >

          <View style={styles.header}>
            <Pressable onPress={handleClose} hitSlop={12} style={styles.headerBtn}>
              <Feather name="arrow-left" size={28} color="#FFF" />
            </Pressable>
            <Text style={styles.headerTitle}>Visualizar produto</Text>
            <Pressable onPress={() => setConfirmDelete(true)} hitSlop={12} style={styles.headerBtn}>
              <Feather name="trash-2" size={26} color="#FFF" />
            </Pressable>
          </View>

          {loading ? (
            <ActivityIndicator style={{ marginVertical: 60 }} color={colors.manager} />
          ) : (
            <ScrollView
              ref={scrollRef}
              contentContainerStyle={{ padding: 24, paddingBottom: 32 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
              scrollEventThrottle={32}
              onLayout={e => { scrollViewH.current = e.nativeEvent.layout.height; recheckFade(); }}
              onContentSizeChange={(_w, h) => { scrollContentH.current = h; recheckFade(); }}
              onScroll={e => {
                const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
                setScrollFade(contentOffset.y + layoutMeasurement.height < contentSize.height - 16);
              }}
            >
              <View onLayout={(e) => onFieldLayout('name', e)}>
                <FieldRow label="Nome">
                  <Input value={name} onChangeText={setName} fieldStyle={fld} inputStyle={txt}
                    onFocus={() => scrollToField('name')} style={{ flex: 1, marginBottom: 0 }} />
                </FieldRow>
              </View>

              <View onLayout={(e) => onFieldLayout('category', e)}>
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
                    <ScrollView style={{ maxHeight: 240 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                      {categories.map((c) => (
                        <Pressable key={c.id}
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
              </View>

              <View onLayout={(e) => onFieldLayout('price', e)}>
                <FieldRow label="Preço">
                  <Input value={price} onChangeText={setPrice} keyboardType="decimal-pad"
                    fieldStyle={fld} inputStyle={txt} onFocus={() => scrollToField('price')}
                    style={{ flex: 1, marginBottom: 0 }} />
                </FieldRow>
              </View>

              <View onLayout={(e) => onFieldLayout('description', e)}>
                <FieldRow label="Descrição" stack>
                  <Input value={description} onChangeText={setDescription} multiline
                    fieldStyle={mFld} inputStyle={txt} onFocus={() => scrollToField('description')}
                    style={{ flex: 1, marginBottom: 0 }} />
                </FieldRow>
              </View>

              <View onLayout={(e) => onFieldLayout('image', e)}>
                <FieldRow label="Imagem" stack>
                  <Pressable onPress={handlePickImage} style={styles.imageBox}>
                    {imageUri ? (
                      <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%', borderRadius: radii.md }} resizeMode="cover" />
                    ) : imageUrl && /^https?:\/\//i.test(imageUrl) ? (
                      <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%', borderRadius: radii.md }} resizeMode="cover" />
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <Feather name="image" size={40} color="#AAA" />
                        <Text style={styles.imagePlaceholderText}>Selecionar foto</Text>
                      </View>
                    )}
                    {(imageUri || (imageUrl && /^https?:\/\//.test(imageUrl))) ? (
                      <View style={styles.imageOverlay}>
                        <Feather name="camera" size={18} color="#FFF" />
                        <Text style={styles.imageOverlayText}>Trocar</Text>
                      </View>
                    ) : null}
                  </Pressable>
                  <Input
                    value={imageUrl}
                    onChangeText={(t) => { setImageUrl(t); if (t) setImageUri(null); }}
                    placeholder="Ou cole uma URL"
                    keyboardType="url" autoCapitalize="none"
                    fieldStyle={fld} inputStyle={txt}
                    onFocus={() => scrollToField('image')}
                    style={{ marginTop: 10, marginBottom: 0 }}
                  />
                </FieldRow>
              </View>

              <View style={{ marginTop: 26 }}>
                <Button title="Salvar" onPress={onSave} loading={saving} />
              </View>
            </ScrollView>
          )}

          {scrollFade ? (
            <View pointerEvents="none" style={styles.scrollFadeOverlay}>
              {[0, 0.07, 0.18, 0.38, 0.62, 0.82, 1].map((opacity, i) => (
                <View key={i} style={{ flex: 1, backgroundColor: '#FFF', opacity }} />
              ))}
            </View>
          ) : null}
        </Animated.View>
      </View>

      <FeedbackModal
        visible={!!feedback}
        variant={feedback?.variant}
        title={feedback?.title || ''}
        message={feedback?.message || ''}
        okLabel="OK"
        onClose={() => { const cb = feedback?.onClose; setFeedback(null); cb?.(); }}
      />
      <ConfirmModal
        visible={confirmDelete}
        variant="danger"
        title="Excluir produto?"
        message="Esta ação irá desativar o produto."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        destructive
        loading={deleting}
        onConfirm={doDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </View>
  );
}

function FieldRow({ label, children, stack }) {
  return (
    <View style={[styles.fieldRow, stack && { alignItems: 'flex-start' }]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={{ flex: 1, marginLeft: 16 }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  dialog: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.30,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
  },

  header: {
    backgroundColor: colors.manager,
    paddingHorizontal: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBtn:   { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#FFF', fontSize: 23, fontWeight: '700' },

  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E9E2',
  },
  fieldLabel: { width: 120, color: colors.textDark, fontWeight: '700', fontSize: 21 },

  catChip:     { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, alignSelf: 'flex-start' },
  catChipText: { color: '#FFF', fontWeight: '800', fontSize: 18, letterSpacing: 0.5 },
  catList:     { marginTop: 8, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: radii.md, backgroundColor: '#FFF', overflow: 'hidden' },
  catOpt:      { padding: 20, borderBottomWidth: 1, borderBottomColor: '#F2F2F2' },
  catOptText:  { color: colors.textDark, fontSize: 19 },

  imageBox: {
    width: 168, height: 168,
    backgroundColor: '#F2F2F2',
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imagePlaceholder:     { alignItems: 'center' },
  imagePlaceholderText: { color: '#AAA', fontSize: 15, marginTop: 8 },
  imageOverlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.45)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 5,
  },
  imageOverlayText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  scrollFadeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 52,
  },
});
