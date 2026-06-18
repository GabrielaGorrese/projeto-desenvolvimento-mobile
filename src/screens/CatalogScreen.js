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
  const contentWidth = r.isTablet ? Math.min(r.width - 32, 1100) : r.contentMaxWidth;
  const prodCols = Math.max(2, Math.min(7, Math.floor(contentWidth / 185)));
  // Categorias: alvo de ~250dp por card.
  const catCols = Math.max(2, Math.min(4, Math.floor(contentWidth / 250)));
  const canManageCats = mode === 'manage' && isManager;

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
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
          <View style={[styles.contentWrap, { maxWidth: contentWidth }]}>
            <SectionHeader title="Categorias" count={categories.length} />

            <View style={styles.catGrid}>
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

            <Divider />

            <SectionHeader title="Produtos" count={products.length} />

            <View style={styles.prodGrid}>
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
                    />
                  </View>
                );
              })}
              {products.length === 0 ? (
                <EmptySection text="Nenhum produto encontrado" />
              ) : null}
            </View>
          </View>
        </ScrollView>
      )}

      {mode === 'select' && cartCount > 0 ? (
        <View style={[styles.confirmBar, { bottom: 126 + insets.bottom }]}>
          <Text style={styles.cartCount}>
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

function SectionHeader({ title, count }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionCount}>({count})</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function EmptySection({ text }) {
  return (
    <View style={styles.emptyWrap}>
      <Image source={require('../../assets/vazio.png')} style={styles.emptyImage} contentFit="contain" />
      <Text style={styles.empty}>{text}</Text>
    </View>
  );
}

function ProductCell({ product, onPress, onMinus, qty, selectable }) {
  return (
    <Pressable onPress={onPress} style={styles.prodCell}>
      <View style={styles.prodImg}>
        {product.image ? (
          <Image
            source={{ uri: thumbUrl(product.image, 300) }}
            style={{ width: '100%', height: '100%', borderRadius: 8 }}
            contentFit="cover"
            transition={150}
            cachePolicy="memory-disk"
            recyclingKey={String(product.id)}
          />
        ) : (
          <Feather name="image" size={34} color="#BBB" />
        )}
        {qty > 0 ? (
          <View style={styles.qtyBadge}>
            <Text style={styles.qtyBadgeText}>{qty}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.prodName} numberOfLines={2}>{product.name}</Text>
      <Text style={styles.prodPrice}>R$ {Number(product.price).toFixed(2).replace('.', ',')}</Text>
      {selectable && qty > 0 ? (
        <Pressable onPress={onMinus} style={styles.minusBtn} hitSlop={8}>
          <Feather name="minus" size={20} color="#FFF" />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 64,
    paddingTop: 34,
    paddingBottom: 160,
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
    marginBottom: 14,
  },
  sectionTitle: { ...typography.bodyBold, color: colors.textDark, fontSize: 26 },
  sectionCount: { ...typography.bodyBold, color: colors.primary, marginLeft: 12, fontSize: 26 },

  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
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
    marginHorizontal: -8,
    marginTop: 0,
  },
  prodCell: {
    padding: 8,
    alignItems: 'center',
  },
  prodImg: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F0EBE6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prodName:  { ...typography.bodyBold, marginTop: 10, color: colors.textDark, textAlign: 'center', fontSize: 18, lineHeight: 23 },
  prodPrice: { color: colors.primary, fontWeight: '700', fontSize: 18, lineHeight: 23, marginTop: 4 },

  qtyBadge: {
    position: 'absolute', top: 6, right: 6, minWidth: 36, height: 36, borderRadius: 24,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  qtyBadgeText: { color: '#FFF', fontWeight: '800', fontSize: 18 },
  minusBtn: {
    position: 'absolute', top: 13, left: 13, minWidth: 36, height: 36, borderRadius: 24,
    backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center',
  },

  confirmBar: {
    position: 'absolute',
    left: 64, right: 64,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    zIndex: 50,
    height: 96
  },
  cartCount: { color: colors.textDark, fontWeight: '700', fontSize: 22, marginLeft: 12 },

  divider: {
    height: 2,
    backgroundColor: '#F0EBE4',
    width: '100%',
    marginTop: 24,
    marginBottom: 24,
  },
  emptyWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 0,
  },
  emptyImage: {
    width: 76,
    height: 76,
    marginTop: 12,
  },
  empty: {
    color: colors.textMuted,
    fontSize: 22,
    lineHeight: 28,
    paddingTop: 10,
    paddingBottom: 18,
    textAlign: 'center',
  },
});
