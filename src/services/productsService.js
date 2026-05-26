import api from './api';

export async function fetchProducts({ search, category_id, active } = {}) {
  const { data } = await api.get('/products', {
    params: { search, category_id, active },
  });
  return data.products;
}

export async function fetchProduct(id) {
  const { data } = await api.get(`/products/${id}`);
  return data.product;
}

// Para create/update com imagem usamos multipart (multer espera "image").
// A imagem pode vir como:
//   - imageUri:  arquivo local (galeria/câmera) — vira upload
//   - imageUrl:  URL externa http(s) — vai como campo image_url
//   - imageUrl === '' explícito limpa a imagem do produto
export async function saveProduct({ id, name, description, price, category_id, imageUri, imageUrl }) {
  const form = new FormData();
  if (name        !== undefined) form.append('name',        name);
  if (description !== undefined) form.append('description', description ?? '');
  if (price       !== undefined) form.append('price',       String(price));
  if (category_id !== undefined) form.append('category_id', String(category_id));

  if (imageUri) {
    // Upload local tem prioridade sobre URL.
    const filename = imageUri.split('/').pop() || 'image.jpg';
    const match    = /\.(\w+)$/.exec(filename);
    const type     = match ? `image/${match[1]}` : 'image/jpeg';
    form.append('image', { uri: imageUri, name: filename, type });
  } else if (imageUrl !== undefined) {
    form.append('image_url', imageUrl || '');
  }

  const url    = id ? `/products/${id}` : '/products';
  const method = id ? 'put' : 'post';

  const { data } = await api[method](url, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.product;
}

export async function deleteProduct(id) {
  const { data } = await api.delete(`/products/${id}`);
  return data;
}

export async function fetchCategories() {
  const { data } = await api.get('/categories');
  return data.categories;
}
