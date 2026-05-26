-- =============================================================
--  SCHEMA COMPLETO — COMANDOU APP
--  Executar do início ao fim em um banco PostgreSQL limpo.
-- =============================================================

-- Habilita busca sem acento (café → cafe, pão → pao).
-- Necessário para GET /api/products?search=
CREATE EXTENSION IF NOT EXISTS unaccent;


-- -------------------------------------------------------------
-- 1. TABELAS DE LOOKUP
-- -------------------------------------------------------------

CREATE TABLE "role" (
  "id"   SERIAL PRIMARY KEY,
  "name" VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE "status" (
  "id"   SERIAL PRIMARY KEY,
  "name" VARCHAR(50) NOT NULL UNIQUE
);


-- -------------------------------------------------------------
-- 2. TABELAS DE SUPORTE
-- -------------------------------------------------------------

-- Categorias são gerenciadas internamente (sem UI); pré-populadas via seed.
CREATE TABLE "category" (
  "id"   SERIAL PRIMARY KEY,
  "name" VARCHAR(100) NOT NULL UNIQUE
);

-- Mesa é opcional em uma comanda. O atendente pode usar só o campo
-- label livre na comanda (ex.: "João", "Balcão"). A mesa pode ser
-- usada quando o estabelecimento quiser associar fisicamente.
CREATE TABLE "table_seat" (
  "id"        SERIAL PRIMARY KEY,
  "label"     VARCHAR(50)  NOT NULL UNIQUE,
  "is_active" BOOLEAN      NOT NULL DEFAULT TRUE
);


-- -------------------------------------------------------------
-- 3. TABELAS PRINCIPAIS
-- -------------------------------------------------------------

CREATE TABLE "users" (
  "id"            SERIAL       PRIMARY KEY,
  "username"      VARCHAR(100) NOT NULL UNIQUE,
  "password_hash" VARCHAR(255) NOT NULL,
  "role_id"       INTEGER      NOT NULL REFERENCES "role"("id"),
  "is_active"     BOOLEAN      NOT NULL DEFAULT TRUE,
  "created_at"    TIMESTAMP    NOT NULL DEFAULT NOW(),
  "updated_at"    TIMESTAMP
);

CREATE TABLE "product" (
  "id"          SERIAL        PRIMARY KEY,
  "name"        VARCHAR(100)  NOT NULL,
  "description" TEXT,
  "price"       DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  "image"       VARCHAR(255),
  "category_id" INTEGER       NOT NULL REFERENCES "category"("id"),
  "is_active"   BOOLEAN       NOT NULL DEFAULT TRUE,
  "created_at"  TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE TABLE "orders" (
  "id"         SERIAL        PRIMARY KEY,
  -- label identifica a comanda de forma legível: "Mesa 3", "João", etc.
  "label"      VARCHAR(100),
  "created_at" TIMESTAMP     NOT NULL DEFAULT NOW(),
  "closed_at"  TIMESTAMP,
  "table_id"   INTEGER       REFERENCES "table_seat"("id"),
  "user_id"    INTEGER       NOT NULL REFERENCES "users"("id"),
  "status_id"  INTEGER       NOT NULL REFERENCES "status"("id"),
  "discount"   DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  "total"      DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  -- Número de pessoas para divisão do total ("rachar").
  "people"     INTEGER       NOT NULL DEFAULT 1 CHECK (people >= 1)
);

CREATE TABLE "order_item" (
  "id"         SERIAL        PRIMARY KEY,
  -- CASCADE: excluir comanda remove também seus itens.
  "order_id"   INTEGER       NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  -- Sem cascade em product: produto inativo ainda aparece em comandas antigas.
  "product_id" INTEGER       NOT NULL REFERENCES "product"("id"),
  "quantity"   INTEGER       NOT NULL DEFAULT 1 CHECK (quantity > 0),
  -- Snapshot do preço no momento da venda; alterações futuras no produto
  -- não afetam comandas já abertas.
  "unit_price" DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  "notes"      TEXT
);


-- -------------------------------------------------------------
-- 4. ÍNDICES
-- -------------------------------------------------------------

CREATE INDEX idx_users_role_id         ON "users"      ("role_id");
CREATE INDEX idx_users_is_active       ON "users"      ("is_active");
CREATE INDEX idx_product_category_id   ON "product"    ("category_id");
CREATE INDEX idx_product_is_active     ON "product"    ("is_active");
CREATE INDEX idx_orders_status_id      ON "orders"     ("status_id");
CREATE INDEX idx_orders_user_id        ON "orders"     ("user_id");
CREATE INDEX idx_orders_table_id       ON "orders"     ("table_id");
CREATE INDEX idx_orders_created_at     ON "orders"     ("created_at");
CREATE INDEX idx_orders_closed_at      ON "orders"     ("closed_at");
CREATE INDEX idx_order_item_order_id   ON "order_item" ("order_id");
CREATE INDEX idx_order_item_product_id ON "order_item" ("product_id");


-- -------------------------------------------------------------
-- 5. DADOS INICIAIS
-- -------------------------------------------------------------

INSERT INTO "role"   ("name") VALUES ('manager'), ('attendant');
INSERT INTO "status" ("name") VALUES ('open'), ('closed');

INSERT INTO "category" ("name") VALUES
  ('Lanches'),
  ('Bebidas'),
  ('Sobremesas'),
  ('Porções'),
  ('Combos');

-- Usuário admin criado via: npm run seed
-- O script de seed gera o hash correto de bcrypt em tempo de execução.


-- -------------------------------------------------------------
-- 6. FUNÇÕES E TRIGGERS
-- -------------------------------------------------------------

-- 6.1  updated_at automático em users
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_updated_at
BEFORE UPDATE ON "users"
FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- 6.2  Bloquear INSERT/UPDATE de item em comanda fechada
-- -------------------------------------------------------------
-- Protege apenas order_item; editar o cadastro do produto em si
-- (nome, preço) continua funcionando normalmente. O unit_price
-- já foi capturado no snapshot quando o item foi adicionado.
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_order_open()
RETURNS TRIGGER AS $$
DECLARE
  v_status VARCHAR;
BEGIN
  SELECT s.name INTO v_status
  FROM   orders o
  JOIN   status s ON s.id = o.status_id
  WHERE  o.id = NEW.order_id;

  IF v_status != 'open' THEN
    RAISE EXCEPTION 'Comanda % já está fechada e não pode ser alterada.', NEW.order_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_block_closed_order
BEFORE INSERT OR UPDATE ON "order_item"
FOR EACH ROW EXECUTE FUNCTION check_order_open();


-- 6.3  Calcular total e registrar closed_at ao fechar comanda
-- -------------------------------------------------------------
-- Deduz o desconto do total bruto; garante que total nunca seja negativo.
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_order_total()
RETURNS TRIGGER AS $$
DECLARE
  v_new_status VARCHAR;
  v_old_status VARCHAR;
BEGIN
  SELECT name INTO v_new_status FROM status WHERE id = NEW.status_id;
  SELECT name INTO v_old_status FROM status WHERE id = OLD.status_id;

  IF v_new_status = 'closed' AND v_old_status != 'closed' THEN
    NEW.total := GREATEST(0, (
      SELECT COALESCE(SUM(quantity * unit_price), 0)
      FROM   order_item
      WHERE  order_id = NEW.id
    ) - COALESCE(NEW.discount, 0));
    NEW.closed_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_close_order
BEFORE UPDATE ON "orders"
FOR EACH ROW EXECUTE FUNCTION calculate_order_total();


-- 6.4  Bloquear adição de produto inativo em nova comanda
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_product_active()
RETURNS TRIGGER AS $$
DECLARE
  v_active BOOLEAN;
BEGIN
  SELECT is_active INTO v_active FROM product WHERE id = NEW.product_id;

  IF NOT v_active THEN
    RAISE EXCEPTION 'Produto % está inativo e não pode ser adicionado ao pedido.', NEW.product_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_product_active
BEFORE INSERT ON "order_item"
FOR EACH ROW EXECUTE FUNCTION check_product_active();


-- 6.5  Bloquear exclusão de mesa com comandas abertas
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION prevent_delete_table_with_open_orders()
RETURNS TRIGGER AS $$
DECLARE
  v_has_open BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM orders
    WHERE  table_id = OLD.id
      AND  closed_at IS NULL
  ) INTO v_has_open;

  IF v_has_open THEN
    RAISE EXCEPTION
      'Não é possível excluir a mesa "%" pois há comandas abertas vinculadas a ela.',
      OLD.label;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_delete_table_open_orders
BEFORE DELETE ON "table_seat"
FOR EACH ROW EXECUTE FUNCTION prevent_delete_table_with_open_orders();
