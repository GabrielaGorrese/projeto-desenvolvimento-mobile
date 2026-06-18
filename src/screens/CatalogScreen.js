import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../components/Screen';
import SearchHeader from '../components/SearchHeader';
import CategoryCard from '../components/CategoryCard';
import BottomBar from '../components/BottomBar';
import Fab from '../components/Fab';
import Button from '../components/Button';
import NewCategoryModal from '../components/NewCategoryModal';
import ConfirmModal from '../components/ConfirmModal';
import FeedbackModal from '../components/FeedbackModal';
import { colors, radii, typography } from '../theme';
import {
  fetchProducts,
  fetchCategories,
  createCategory,
  deleteCategory,
} from '../services/productsService';
import { useAuth } from '../contexts/AuthContext';
import { usePendingItems } from '../contexts/PendingItemsContext';
import { onSocket } from '../services/socket';
import useResponsive from '../hooks/useResponsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const REF_MIN_SIDE = 820;

function scaleSize(value, minSide) {
  const factor = Math.min(1.35, Math.max(0.72, minSide / REF_MIN_SIDE));
  return Math.round(value * factor);
}

// Otimiza URLs de imagem externas pedindo uma versão menor (mais rápida e leve).
function thumbUrl(url, w = 300) {
  if (!url || typeof url !== 'string') return url;
  const sep = url.includes('?') ? '&' : '?';
  if (url.includes('images.unsplash.com')) {
    return `${url}${sep}w=${w}&q=60&auto=format&fit=crop`;
  }
  if (/(?:images\.weserv\.nl|wsrv\.nl)/.test(url)) {
    return `${url}${sep}w=${w}&q=60`;
  }
  return url;
}

// Tela única servindo dois modos:
//  - mode="manage"  (gerente): clicar em produto -> visualizar/editar
//  - mode="select"  (atendente, vindo do OrderDetail): selecionar e voltar
export default function CatalogScreen({ navigation, route }) {
  const mode    = route.params?.mode || 'select';
  const orderId = route.params?.orderId;
  const { isManager } = useAuth();
  const { setPendingItems } = usePendingItems();
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const minSide = Math.min(r.width, r.height);
  const contentWidth = r.isTablet ? Math.min(r.width - 32, 1100) : r.contentMaxWidth;
  const prodCols = Math.max(2, Math.min(7, Math.floor(contentWidth / scaleSize(185, minSide))));
  const catCols = Math.max(2, Math.min(4, Math.floor(contentWidth / scaleSize(250, minSide))));
  const canManageCats = mode === 'manage' && isManager;
  const ui = {
    scrollPadH: scaleSize(20, minSide),
    scrollPadTop: scaleSize(34, minSide),
    scrollPadBottom: scaleSize(160, minSide),
    loadingMarginTop: scaleSize(40, minSide),
    sectionTitle: scaleSize(26, minSide),
    sectionCountMargin: scaleSize(12, minSide),
    sectionHeaderMarginBottom: scaleSize(14, minSide),
    dividerMargin: scaleSize(24, minSide),
    catGridMarginH: scaleSize(-6, minSide),
    prodGridMarginH: scaleSize(-8, minSide),
    prodCellPadding: scaleSize(8, minSide),
    prodImgRadius: scaleSize(12, minSide),
    prodNameMarginTop: scaleSize(10, minSide),
    prodNameFont: scaleSize(18, minSide),
    prodNameLineHeight: scaleSize(23, minSide),
    prodPriceFont: scaleSize(18, minSide),
    prodPriceLineHeight: scaleSize(23, minSide),
    prodPriceMarginTop: scaleSize(4, minSide),
    prodIconSize: scaleSize(34, minSide),
    qtyBadgeMinW: scaleSize(36, minSide),
    qtyBadgeHeight: scaleSize(36, minSide),
    qtyBadgeRadius: scaleSize(24, minSide),
    qtyBadgeTop: scaleSize(6, minSide),
    qtyBadgeRight: scaleSize(6, minSide),
    qtyBadgePaddingH: scaleSize(6, minSide),
    qtyBadgeFont: scaleSize(18, minSide),
    minusBtnTop: scaleSize(13, minSide),
    minusBtnLeft: scaleSize(13, minSide),
    minusBtnMinW: scaleSize(36, minSide),
    minusBtnHeight: scaleSize(36, minSide),
    minusBtnRadius: scaleSize(24, minSide),
    minusIconSize: scaleSize(20, minSide),
    confirmBarBottom: scaleSize(126, minSide),
    confirmBarHeight: scaleSize(96, minSide),
    confirmBarPaddingH: scaleSize(14, minSide),
    confirmBarPaddingV: scaleSize(10, minSide),
    cartCountFont: scaleSize(22, minSide),
    cartCountMarginLeft: scaleSize(12, minSide),
    emptyImage: scaleSize(76, minSide),
    emptyFont: scaleSize(22, minSide),
    emptyLineHeight: scaleSize(28, minSide),
    emptyPaddingTop: scaleSize(10, minSide),
    emptyPaddingBottom: scaleSize(18, minSide),
    emptyWrapPaddingV: scaleSize(24, minSide),
    emptyImageMarginTop: scaleSize(12, minSide),
    
  };

  const [categories, setCategories] = useState([]);
  const [products,   setProducts]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [cart,       setCart]       = useState({}); // {product_id: { product, qty }}
  const [catModal,    setCatModal]    = useState(false);
  const [newCatName,  setNewCatName]  = useState('');
  const [creatingCat, setCreatingCat] = useState(false);
  const [catError,    setCatError]    = useState('');
  const [catToDelete, setCatToDelete] = useState(null);
  const [deletingCat, setDeletingCat] = useState(false);
  const [catDeleteError, setCatDeleteError] = useState(null);

  const load = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const [cats, prods] = await Promise.all([
        fetchCategories(),
        fetchProducts({ search: search.trim() || undefined, category_id: categoryId || undefined }),
      ]);
      setCategories(cats || []);
      setProducts(prods || []);
      const urls = (prods || []).map((p) => thumbUrl(p.image, 300)).filter(Boolean);
      if (urls.length) {
        Image.prefetch(urls, { cachePolicy: 'memory-disk' }).catch(() => {});
      }
    } catch (err) {
      console.warn('catalog', err?.uiMessage);
    } finally { setLoading(false); }
  }, [search, categoryId]);


  useFocusEffect(useCallback(() => { load(); }, [load]));


  const loadRef = useRef(load);
  loadRef.current = load;
  useEffect(() => {
    const reload = () => loadRef.current({ silent: true });

    const onUpdated = (product) => {
      if (product?.id != null) {
        setCart((c) => (c[product.id] ? { ...c, [product.id]: { ...c[product.id], product } } : c));
      }
      reload();
    };
    const onDeleted = ({ id } = {}) => {
      if (id != null) {
        setCart((c) => {
          if (!c[id]) return c;
          const next = { ...c };
          delete next[id];
          return next;
        });
      }
      reload();
    };

    const subs = [
      onSocket('product:created',  reload),
      onSocket('product:updated',  onUpdated),
      onSocket('product:deleted',  onDeleted),
      onSocket('product:restored', reload),
      onSocket('category:created', reload),
      onSocket('category:deleted', reload),
      onSocket('connect',          reload),
    ];
    return () => subs.forEach((off) => off());
  }, []);

  function increment(prod) {
    setCart((c) => {
      const cur = c[prod.id] || { product: prod, qty: 0 };
      return { ...c, [prod.id]: { product: prod, qty: cur.qty + 1 } };
    });
  }
  function decrement(prod) {
    setCart((c) => {
      const cur = c[prod.id];
      if (!cur) return c;
      const qty = cur.qty - 1;
      const next = { ...c };
      if (qty <= 0) delete next[prod.id];
      else          next[prod.id] = { ...cur, qty };
      return next;
    });
  }

  const cartItems = Object.values(cart);
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);

  function confirmAdd() {
    const items = cartItems.map((i) => ({
      product_id:   i.product.id,
      quantity:     i.qty,
      unit_price:   i.product.price,
      product_name: i.product.name,
      image:        i.product.image,
    }));

    setPendingItems(orderId, items);
    navigation.goBack();
  }

  function onProductPress(p) {
    if (mode === 'manage') {
      navigation.navigate('ProductDetail', { id: p.id });
    } else {
      increment(p);
    }
  }

  function openCatModal() {
    setNewCatName('');
    setCatError('');
    setCatModal(true);
  }

  async function createCat() {
    const name = newCatName.trim();
    if (!name) { setCatError('Informe o nome da categoria.'); return; }
    try {
      setCreatingCat(true);
      setCatError('');
      await createCategory(name);
      setCatModal(false);
      setNewCatName('');
      load({ silent: true });
    } catch (err) {
      setCatError(err?.uiMessage || 'Erro ao criar categoria.');
    } finally {
      setCreatingCat(false);
    }
  }

  async function confirmDeleteCat() {
    if (!catToDelete) return;
    try {
      setDeletingCat(true);
      await deleteCategory(catToDelete.id);
      if (categoryId === catToDelete.id) setCategoryId(null);
      setCatToDelete(null);
      load({ silent: true });
    } catch (err) {
      const msg = err?.uiMessage || 'Erro ao excluir categoria.';
      setCatToDelete(null);
      setCatDeleteError(msg);
    } finally {
      setDeletingCat(false);
    }
  }

  return (
    <Screen background="#FFF" statusBarBg={colors.bgDark} statusBarStyle="light-content" edges={['top']} avoidKeyboard={false}>
      <SearchHeader
        onBack={() => navigation.goBack()}
        placeholder="Buscar produto..."
        value={search}
        onChangeText={setSearch}
        onSubmit={load}
      />

      {loading ? (
        <ActivityIndicator style={{ marginTop: ui.loadingMarginTop }} color={colors.primary} />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: ui.scrollPadH,
              paddingTop: ui.scrollPadTop,
              paddingBottom: ui.scrollPadBottom,
            },
          ]}
        >
          <View style={[styles.contentWrap, { maxWidth: contentWidth }]}>
            <SectionHeader title="Categorias" count={categories.length} ui={ui} />

            <View style={[styles.catGrid, { marginHorizontal: ui.catGridMarginH }]}>
              {categories.map((c) => (
                <View key={c.id} style={{ width: `${100 / catCols}%` }}>
                  <CategoryCard
                    category={c}
                    onPress={() => setCategoryId((cur) => cur === c.id ? null : c.id)}
                    onDelete={canManageCats ? () => setCatToDelete(c) : undefined}
                    style={categoryId === c.id ? { borderWidth: 3, borderColor: colors.primary } : null}
                  />
                </View>
              ))}
              {canManageCats ? (
                <View style={{ width: `${100 / catCols}%` }}>
                  <AddCategoryCard onPress={openCatModal} />
                </View>
              ) : null}
            </View>

            <Divider ui={ui} />

            <SectionHeader title="Produtos" count={products.length} ui={ui} />

            <View style={[styles.prodGrid, { marginHorizontal: ui.prodGridMarginH }]}>
              {products.map((p) => {
                const qty = cart[p.id]?.qty || 0;
                return (
                  <View key={p.id} style={{ width: `${100 / prodCols}%` }}>
                    <ProductCell
                      product={p}
                      qty={qty}
                      selectable={mode === 'select'}
                      onPress={() => onProductPress(p)}
                      onMinus={() => decrement(p)}
                      ui={ui}
                    />
                  </View>
                );
              })}
              {products.length === 0 ? (
                <EmptySection text="Nenhum produto encontrado" ui={ui} />
              ) : null}
            </View>
          </View>
        </ScrollView>
      )}

      {mode === 'select' && cartCount > 0 ? (
        <View
          style={[
            styles.confirmBar,
            {
              left: ui.scrollPadH,
              right: ui.scrollPadH,
              bottom: ui.confirmBarBottom + insets.bottom,
              height: ui.confirmBarHeight,
              paddingHorizontal: ui.confirmBarPaddingH,
              paddingVertical: ui.confirmBarPaddingV,
            },
          ]}
        >
          <Text style={[styles.cartCount, { fontSize: ui.cartCountFont, marginLeft: ui.cartCountMarginLeft }]}>
            {cartCount} {cartCount === 1 ? 'item' : 'itens'}
          </Text>
          <View style={{ flex: 1 }} />
          
          <Button title="Adicionar à comanda" onPress={confirmAdd} fullWidth={false} />
        </View>
      ) : null}

      <BottomBar current={mode === 'manage' ? 'catalog' : 'home'} />
      {/* FAB depois do BottomBar para ficar visualmente por cima */}
      {mode === 'manage' && isManager ? (
        <Fab onPress={() => navigation.navigate('ProductEdit', { id: 'new' })}
        centeredOnBottomBar
         />
      ) : null}

      <NewCategoryModal
        visible={catModal}
        value={newCatName}
        onChangeText={(t) => { setNewCatName(t); if (catError) setCatError(''); }}
        loading={creatingCat}
        error={catError}
        onCancel={() => { if (!creatingCat) setCatModal(false); }}
        onConfirm={createCat}
      />

      <ConfirmModal
        visible={!!catToDelete}
        variant="danger"
        title={`Excluir "${catToDelete?.name}"?`}
        message="A categoria será removida. Só é possível se não houver produtos nela."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        destructive
        loading={deletingCat}
        onConfirm={confirmDeleteCat}
        onCancel={() => { if (!deletingCat) setCatToDelete(null); }}
      />

      <FeedbackModal
        visible={!!catDeleteError}
        variant="danger"
        title="Não foi possível excluir"
        message={catDeleteError || ''}
        okLabel="OK"
        onClose={() => setCatDeleteError(null)}
      />
    </Screen>
  );
}

function AddCategoryCard({ onPress }) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'rgba(204,126,74,0.12)' }}
      style={({ pressed }) => [styles.addCatCard, pressed && { opacity: 0.85 }]}
    >
      <View style={styles.addCatIcon}>
        <Feather name="plus" size={26} color={colors.primary} />
      </View>
      <Text style={styles.addCatText}>Nova categoria</Text>
    </Pressable>
  );
}

function SectionHeader({ title, count, ui }) {
  return (
    <View style={[styles.sectionHeader, { marginBottom: ui.sectionHeaderMarginBottom }]}>
      <Text style={[styles.sectionTitle, { fontSize: ui.sectionTitle }]}>{title}</Text>
      <Text style={[styles.sectionCount, { fontSize: ui.sectionTitle, marginLeft: ui.sectionCountMargin }]}>({count})</Text>
    </View>
  );
}

function Divider({ ui }) {
  return (
    <View
      style={[
        styles.divider,
        { marginTop: ui.dividerMargin, marginBottom: ui.dividerMargin },
      ]}
    />
  );
}

function EmptySection({ text, ui }) {
  return (
    <View style={[styles.emptyWrap, { paddingVertical: ui.emptyWrapPaddingV }]}>
      <Image
        source={require('../../assets/vazio.png')}
        style={{
          width: ui.emptyImage,
          height: ui.emptyImage,
          marginTop: ui.emptyImageMarginTop,
        }}
        contentFit="contain"
      />
      <Text
        style={[
          styles.empty,
          {
            fontSize: ui.emptyFont,
            lineHeight: ui.emptyLineHeight,
            paddingTop: ui.emptyPaddingTop,
            paddingBottom: ui.emptyPaddingBottom,
          },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

function ProductCell({ product, onPress, onMinus, qty, selectable, ui }) {
  return (
    <Pressable onPress={onPress} style={[styles.prodCell, { padding: ui.prodCellPadding }]}>
      <View style={[styles.prodImg, { borderRadius: ui.prodImgRadius }]}>
        {product.image ? (
          <Image
            source={{ uri: thumbUrl(product.image, 300) }}
            style={{ width: '100%', height: '100%', borderRadius: ui.prodImgRadius - 4 }}
            contentFit="cover"
            transition={150}
            cachePolicy="memory-disk"
            recyclingKey={String(product.id)}
          />
        ) : (
          <Feather name="image" size={ui.prodIconSize} color="#BBB" />
        )}
        {qty > 0 ? (
          <View
            style={[
              styles.qtyBadge,
              {
                top: ui.qtyBadgeTop,
                right: ui.qtyBadgeRight,
                minWidth: ui.qtyBadgeMinW,
                height: ui.qtyBadgeHeight,
                borderRadius: ui.qtyBadgeRadius,
                paddingHorizontal: ui.qtyBadgePaddingH,
              },
            ]}
          >
            <Text style={[styles.qtyBadgeText, { fontSize: ui.qtyBadgeFont }]}>{qty}</Text>
          </View>
        ) : null}
      </View>
      <Text
        style={[
          styles.prodName,
          {
            marginTop: ui.prodNameMarginTop,
            fontSize: ui.prodNameFont,
            lineHeight: ui.prodNameLineHeight,
          },
        ]}
        numberOfLines={2}
      >
        {product.name}
      </Text>
      <Text
        style={[
          styles.prodPrice,
          {
            fontSize: ui.prodPriceFont,
            lineHeight: ui.prodPriceLineHeight,
            marginTop: ui.prodPriceMarginTop,
          },
        ]}
      >
        R$ {Number(product.price).toFixed(2).replace('.', ',')}
      </Text>
      {selectable && qty > 0 ? (
        <Pressable
          onPress={onMinus}
          style={[
            styles.minusBtn,
            {
              top: ui.minusBtnTop,
              left: ui.minusBtnLeft,
              minWidth: ui.minusBtnMinW,
              height: ui.minusBtnHeight,
              borderRadius: ui.minusBtnRadius,
            },
          ]}
          hitSlop={8}
        >
          <Feather name="minus" size={ui.minusIconSize} color="#FFF" />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    alignItems: 'center',
  },
  contentWrap: {
    width: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
    marginTop: 0,
  },
  sectionTitle: { ...typography.bodyBold, color: colors.textDark },
  sectionCount: { ...typography.bodyBold, color: colors.primary },

  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 0,
  },
  addCatCard: {
    flex: 1,
    height: 136,
    borderRadius: radii.lg,
    margin: 6,
    borderWidth: 2,
    borderColor: colors.primaryLight,
    borderStyle: 'dashed',
    backgroundColor: '#FFF7F1',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addCatIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FBE6D7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCatText: { color: colors.primary, fontWeight: '800', fontSize: 15 },

  prodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 0,
  },
  prodCell: {
    alignItems: 'center',
  },
  prodImg: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F0EBE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prodName:  { ...typography.bodyBold, color: colors.textDark, textAlign: 'center' },
  prodPrice: { color: colors.primary, fontWeight: '700' },

  qtyBadge: {
    position: 'absolute',
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBadgeText: { color: '#FFF', fontWeight: '800' },
  minusBtn: {
    position: 'absolute',
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },

  confirmBar: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: radii.lg,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    zIndex: 50,
  },
  cartCount: { color: colors.textDark, fontWeight: '700' },

  divider: {
    height: 2,
    backgroundColor: '#F0EBE4',
    width: '100%',
  },
  emptyWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  empty: {
    color: colors.textMuted,
    textAlign: 'center',
  },
});
