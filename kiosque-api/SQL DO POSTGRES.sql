-- =============================================================
--  SCHEMA COMPLETO — QUIOSQUE APP
--  Ordem de execução: rodar de cima para baixo
-- =============================================================


-- -------------------------------------------------------------
-- 1. TABELAS 
-- -------------------------------------------------------------

CREATE TABLE "role" (
  "id"   SERIAL PRIMARY KEY,
  "name" VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE "status" (
  "id"   SERIAL PRIMARY KEY,
  "name" VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE "category" (
  "id"   SERIAL PRIMARY KEY,
  "name" VARCHAR(100) NOT NULL
);

CREATE TABLE "table_seat" (
  "id"        SERIAL PRIMARY KEY,
  "label"     VARCHAR(50) NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE
);


-- -------------------------------------------------------------
-- 2. TABELAS PRINCIPAIS 
-- -------------------------------------------------------------

CREATE TABLE "users" (
  "id"            SERIAL PRIMARY KEY,
  "username"      VARCHAR(100) NOT NULL UNIQUE,
  "password_hash" VARCHAR(255) NOT NULL,
  "role_id"       INTEGER      NOT NULL REFERENCES "role" ("id") DEFERRABLE INITIALLY IMMEDIATE,
  "created_at"    TIMESTAMP    NOT NULL DEFAULT NOW(),
  "updated_at"    TIMESTAMP
);

CREATE TABLE "product" (
  "id"          SERIAL PRIMARY KEY,
  "name"        VARCHAR(100)  NOT NULL,
  "price"       DECIMAL(10,2) NOT NULL,
  "category_id" INTEGER       NOT NULL REFERENCES "category" ("id") DEFERRABLE INITIALLY IMMEDIATE,
  "is_active"   BOOLEAN       NOT NULL DEFAULT TRUE
);

CREATE TABLE "orders" (
  "id"         SERIAL PRIMARY KEY,
  "created_at" TIMESTAMP     NOT NULL DEFAULT NOW(),
  "closed_at"  TIMESTAMP,
  "table_id"   INTEGER       REFERENCES "table_seat" ("id") DEFERRABLE INITIALLY IMMEDIATE,
  "user_id"    INTEGER       NOT NULL REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE,
  "status_id"  INTEGER       NOT NULL REFERENCES "status" ("id") DEFERRABLE INITIALLY IMMEDIATE,
  "total"      DECIMAL(10,2) NOT NULL DEFAULT 0
);

CREATE TABLE "order_item" (
  "id"         SERIAL PRIMARY KEY,
  "order_id"   INTEGER       NOT NULL REFERENCES "orders" ("id") DEFERRABLE INITIALLY IMMEDIATE,
  "product_id" INTEGER       NOT NULL REFERENCES "product" ("id") DEFERRABLE INITIALLY IMMEDIATE,
  "quantity"   INTEGER       NOT NULL DEFAULT 1,
  "unit_price" DECIMAL(10,2) NOT NULL,
  "notes"      VARCHAR(255)
);


-- -------------------------------------------------------------
-- 3. DADOS INICIAIS 
-- -------------------------------------------------------------

INSERT INTO "role" ("name") VALUES ('manager'), ('attendant');

INSERT INTO "status" ("name") VALUES ('open'), ('closed');

INSERT INTO "table_seat" ("label") VALUES ('Mesa 1'), ('Mesa 2'), ('Balcão');


-- -------------------------------------------------------------
-- 4. FUNÇÕES E TRIGGERS
-- -------------------------------------------------------------

-- 4.1 updated_at automático no user
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


-- 4.2 Bloquear inserção/edição de item em comanda fechada
-- -------------------------------------------------------------
-- Nota: editar o PRODUTO em si (nome, preço, imagem) continua
-- funcionando normalmente — esse trigger só protege order_item.
-- A comanda fechada já guardou o unit_price do momento da venda.
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_order_open()
RETURNS TRIGGER AS $$
DECLARE
  v_status VARCHAR;
BEGIN
  SELECT s.name INTO v_status
  FROM orders o
  JOIN status s ON s.id = o.status_id
  WHERE o.id = NEW.order_id;

  IF v_status != 'open' THEN
    RAISE EXCEPTION 'Comanda % já está fechada e não pode ser alterada.', NEW.order_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_block_closed_order
BEFORE INSERT OR UPDATE ON order_item
FOR EACH ROW EXECUTE FUNCTION check_order_open();


-- 4.3 Calcular total e registrar closed_at ao fechar comanda
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
    NEW.total := (
      SELECT COALESCE(SUM(quantity * unit_price), 0)
      FROM order_item
      WHERE order_id = NEW.id
    );
    NEW.closed_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_close_order
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION calculate_order_total();


-- 4.4 Bloquear adição de produto inativo na comanda
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

CREATE TRIGGER trg_block_inactive_product
BEFORE INSERT ON order_item
FOR EACH ROW EXECUTE FUNCTION check_product_active();

