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
import { colors, radii, typography } from '../theme';
import {
  fetchProducts,
  fetchCategories,
} from '../services/productsService';
import { useAuth } from '../contexts/AuthContext';
import { usePendingItems } from '../contexts/PendingItemsContext';
import { connectSocket } from '../services/socket';
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
  const prodCols = Math.max(2, Math.min(7, Math.floor(r.width / 185)));
  // Categorias: alvo de ~250dp por card.
  const catCols = Math.max(2, Math.min(4, Math.floor(r.width / 250)));

  const [categories, setCategories] = useState([]);
  const [products,   setProducts]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [cart,       setCart]       = useState({}); // {product_id: { product, qty }}

  const load = useCallback(async () => {
    try {
      setLoading(true);
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
    const s = connectSocket();
    const reload = () => loadRef.current();

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

    s.on('product:created',  reload);
    s.on('product:updated',  onUpdated);
    s.on('product:deleted',  onDeleted);
    s.on('product:restored', reload);
    return () => {
      s.off('product:created',  reload);
      s.off('product:updated',  onUpdated);
      s.off('product:deleted',  onDeleted);
      s.off('product:restored', reload);
    };
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
        <ScrollView contentContainerStyle={{ paddingBottom: 160 }}>
          <View style={{ width: '100%', marginTop: 24, alignSelf: 'center' }}>
          <SectionHeader style={styles.sectionHeader} title="Categorias" count={categories.length} />

          <View style={styles.catGrid}>
            {categories.map((c) => (
              <View key={c.id} style={{ width: `${100 / catCols}%`, paddingHorizontal: 1 }}>
                <CategoryCard
                  category={c}
                  onPress={() => setCategoryId((cur) => cur === c.id ? null : c.id)}
                  style={categoryId === c.id ? { borderWidth: 3, borderColor: colors.primary } : null}
                />
              </View>
            ))}
          </View>

          <View
            style={{
              height: 1,
              backgroundColor: '#ccc',
              width: '100%',
              marginTop: 36,
            }}
          />

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Todos</Text>
            <Text style={styles.sectionCount}>({products.length})</Text>
          </View>

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
              <Text style={styles.empty}>Nenhum produto encontrado.</Text>
            ) : null}
          </View>
          </View>
        </ScrollView>
      )}

      {mode === 'select' && cartCount > 0 ? (
        <View style={[styles.confirmBar, { bottom: 70 + insets.bottom }]}>
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
        <Fab onPress={() => navigation.navigate('ProductEdit', { id: 'new' })} />
      ) : null}
    </Screen>
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
          <Feather name="minus" size={18} color="#FFF" />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginTop: 36,
    marginBottom: 4,
  },
  sectionTitle: { ...typography.h3, color: colors.textDark, fontSize: 24 },
  sectionCount: { ...typography.bodyBold, color: colors.primary, marginLeft: 8, fontSize: 20 },
  addCat:       {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#F0F0F0',
    alignItems: 'center', justifyContent: 'center',
  },

  catGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 6, marginTop: 6 },

  prodGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 6 },
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
  prodName:  { ...typography.caption, marginTop: 8, color: colors.textDark, textAlign: 'center', fontSize: 15 },
  prodPrice: { color: colors.primary, fontWeight: '700', fontSize: 16, marginTop: 4 },

  qtyBadge: {
    position: 'absolute', top: 6, right: 6, minWidth: 30, height: 30, borderRadius: 15,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  qtyBadgeText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  minusBtn: {
    position: 'absolute', top: 8, left: 8, width: 30, height: 30, borderRadius: 15,
    backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center',
  },

  confirmBar: {
    position: 'absolute',
    left: 12, right: 12,
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
  },
  cartCount: { color: colors.textDark, fontWeight: '700', fontSize: 17, marginRight: 8 },

  empty: { padding: 24, color: colors.textMuted, fontStyle: 'italic', fontSize: 16 },
});
