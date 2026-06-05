import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
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
import useResponsive from '../hooks/useResponsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Tela única servindo dois modos:
//  - mode="manage"  (gerente): clicar em produto -> visualizar/editar
//  - mode="select"  (atendente, vindo do OrderDetail): selecionar e voltar
export default function CatalogScreen({ navigation, route }) {
  const mode    = route.params?.mode || 'select';
  const orderId = route.params?.orderId;
  const { isManager } = useAuth();
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  // Quantas colunas no grid de produtos? Alvo: ~140dp por célula.
  const prodCols = Math.max(2, Math.min(8, Math.floor(r.width / 140)));
  // Categorias: alvo de ~200dp por card.
  const catCols  = Math.max(2, Math.min(4, Math.floor(r.width / 200)));

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
    } catch (err) {
      console.warn('catalog', err?.uiMessage);
    } finally { setLoading(false); }
  }, [search, categoryId]);

  useEffect(() => { load(); }, [load]);

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
    // Volta para a tela anterior passando os itens via params
    navigation.navigate({
      name: 'OrderDetail',
      params: { id: orderId, addItems: items },
      merge: true,
    });
  }

  function onProductPress(p) {
    if (mode === 'manage') {
      navigation.navigate('ProductDetail', { id: p.id });
    } else {
      increment(p);
    }
  }

  return (
    <Screen background="#FFF" statusBarBg={colors.bgDark} statusBarStyle="light-content" edges={['top']}>
      <SearchHeader
        onBack={() => navigation.goBack()}
        placeholder="Produto"
        value={search}
        onChangeText={setSearch}
        onSubmit={load}
      />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 160 }}>
          <View style={{ width: '100%', maxWidth: r.contentMaxWidth, marginTop: 24, alignSelf: 'center' }}>
          <SectionHeader style={styles.sectionHeader} title="Categorias" count={categories.length} />

          <View style={styles.catGrid}>
            {categories.map((c) => (
              <View key={c.id} style={{ width: `${80 / catCols}%`, paddingHorizontal: 1 }}>
                <CategoryCard
                  category={c}
                  onPress={() => setCategoryId((cur) => cur === c.id ? null : c.id)}
                  style={categoryId === c.id ? { borderWidth: 3, borderColor: colors.primary } : null}
                />
              </View>
            ))}
          </View>

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

      <BottomBar current="home" onChange={() => {}} />
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
          <Image source={{ uri: product.image }} style={{ width: '100%', height: '100%', borderRadius: 8 }} />
        ) : (
          <Feather name="image" size={26} color="#BBB" />
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
          <Feather name="minus" size={14} color="#FFF" />
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
    padding: 6,
    alignItems: 'center',
  },
  prodImg: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F0EBE6',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prodName:  { ...typography.caption, marginTop: 6, color: colors.textDark, textAlign: 'center', fontSize: 11 },
  prodPrice: { color: colors.primary, fontWeight: '700', fontSize: 12, marginTop: 2 },

  qtyBadge: {
    position: 'absolute', top: 4, right: 4, minWidth: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  qtyBadgeText: { color: '#FFF', fontWeight: '800', fontSize: 11 },
  minusBtn: {
    position: 'absolute', top: 6, left: 6, width: 22, height: 22, borderRadius: 11,
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
  cartCount: { color: colors.textDark, fontWeight: '700', fontSize: 14, marginRight: 8 },

  empty: { padding: 24, color: colors.textMuted, fontStyle: 'italic' },
});
