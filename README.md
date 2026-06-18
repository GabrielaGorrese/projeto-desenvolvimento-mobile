# Projeto Integrador: Desenvolvimento Mobile - COMANDOU

App mobile (Expo / React Native) + API (Node.js / Express / PostgreSQL) para gerenciamento de comandas em quiosques.

- **Beneficiário 01:** Wesley Dagostin
- **Nome ou empresa:** Quiosque da Amizade
- **CPF/CNPJ:** 37.919.434/0001-08
- **Endereço:** Rod. Luiz Rosso, 7722, CEP 88812-000
- **Relato do Problema:** "Como os itens são escritos na comanda e entregue ao cliente, muitas vezes gera transtorno na parte da cozinha por esquecer o cliente pediu. Na hora de pagamento no caixa, como não possui um controle exato, acaba que cliente sai sem pagar as vezes, um app vai ajudar a organizar muito"

## Grupo

- BRUNO PAGANI RAMPINELLI
- GABRIELA DE SOUZA GORRESE
- JOÃO HENRIQUE CAMILO FOGAÇA
- MATHEUS DE SOUZA CONSTANTE
- PAULO HENRIQUE DA SILVA MACCARI

## Modelo Banco de Dados

[Acessar Modelo do BD](./Diagrama.pdf)

---

# Como rodar o projeto do zero

## 1. Pré-requisitos

Instalar antes de começar:

| Software | Versão recomendada | Link |
|----------|---------------------|------|
| **Node.js** | 20.x ou superior | <https://nodejs.org> |
| **Git** | qualquer recente | <https://git-scm.com> |
| **PostgreSQL** | 14 ou superior | <https://www.postgresql.org/download/> |
| **Android Studio** | última versão | <https://developer.android.com/studio> |
| **JDK** (vem com o Android Studio) | 17+ | - |

Durante a instalação do **PostgreSQL**, anote a senha do usuário `postgres`, vamos usar depois.

Durante a instalação do **Android Studio**, marque "Android Virtual Device" para poder criar emuladores.

---

## 2. Clonar o repositório

```bash
git clone https://github.com/SEU_USER/SEU_REPO.git
cd SEU_REPO
```

---

## 3. Configurar o banco PostgreSQL

### 3.1. Abrir o pgAdmin (vem com o Postgres)

1. Abre o **pgAdmin** e conecta com a senha do `postgres`
2. Clica com botão direito em **Databases** → **Create** → **Database**
3. Nome: `postgres2` (ou outro, vai precisar usar no `.env`)
4. Clica **Save**

### 3.2. Rodar o schema SQL

1. Clica no banco recém-criado → ícone de **Query Tool** (folha com lupa)
2. Abre o arquivo [kiosque-api/SQL DO POSTGRES.sql](kiosque-api/SQL%20DO%20POSTGRES.sql) no editor de texto
3. Copia **tudo** e cola no Query Tool do pgAdmin
4. Aperta **F5** ou clica no botão Executar
5. Deve aparecer "Query returned successfully", todas as tabelas foram criadas

> Se aparecer erro "extension unaccent not exist", você precisa rodar o pgAdmin como administrador. Ou execute manualmente: `CREATE EXTENSION IF NOT EXISTS unaccent;`

---

## 4. Configurar o backend (API)

### 4.1. Instalar dependências

```bash
cd kiosque-api
npm install
```

### 4.2. Criar arquivo `.env`

Crie um arquivo chamado `.env` dentro de `kiosque-api/` com:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=postgres2
DB_USER=postgres
DB_PASSWORD=SUA_SENHA_DO_POSTGRES

JWT_SECRET=qualquer_string_secreta_aqui
JWT_EXPIRES_IN=30d
```

**Substitua `SUA_SENHA_DO_POSTGRES`** pela senha que você definiu na instalação do Postgres.

### 4.3. Rodar o seed (cria usuário admin)

```bash
npm run seed
```

Deve aparecer:
```
Usuário admin criado.
  Username : admin
  Senha    : admin123
```

### 4.4. Criar usuário de teste (atendente)

```bash
node src/scripts/createTestUser.js
```

Deve aparecer:
```
Usuário "teste" criado.
  username: teste
  senha:    teste123
```

### 4.5. Iniciar a API

```bash
npm run dev
```

Deve aparecer:
```
Servidor rodando na porta 3000
Documentação: http://localhost:3000/api-docs
Socket.IO ativo
```

**Deixe esse terminal aberto**, é a API rodando.

---

## 5. Configurar o app mobile (frontend)

### 5.1. Em **outro terminal**, instalar dependências

```bash
# voltar pra raiz do projeto (sair de kiosque-api)
cd ..
npm install
```

### 5.2. Criar emulador Android

1. Abre o **Android Studio**
2. Menu **Tools → Device Manager** (ou ícone do celular na barra direita)
3. **Create Virtual Device**
4. Escolhe **Tablet → Medium Tablet** (ou Pixel Tablet)
5. Faz download da imagem do sistema (API 34 ou 35)
6. Finaliza a criação
7. Inicia o emulador

> **Atenção:** se aparecer um menu de "Desktop Mode" ou janela flutuante, **maximize** a janela (clica nos 3 pontos → "Use full screen") senão alguns layouts ficam quebrados.

### 5.3. Iniciar o app

Com o emulador aberto, no terminal (na raiz do projeto):

```bash
npm run android
```

Esse comando faz 3 coisas:
1. `adb reverse tcp:8081 tcp:8081` encaminha a porta do Metro
2. `adb reverse tcp:3000 tcp:3000` encaminha a porta da API
3. `expo start --android --localhost` inicia o Expo no modo certo

Vai abrir o **Expo Go** no emulador automaticamente.

> Se aparecer erro `adb: no devices/emulators found`, é porque o emulador não está rodando. Inicia o emulador primeiro e tenta de novo.

> Na primeira vez, vai pedir pra **instalar o Expo Go**. Aceita.

### 5.4. Rodar nos tablets de verdade

O emulador acima é só pra desenvolver. Nos tablets físicos (o caso do quiosque), os aparelhos e o PC que roda a API precisam estar na **mesma rede**. Aponta cada tablet pro IP do servidor, seja pela tela de configuração de conexão no app ou deixando o `BUILT_IN_DEFAULT` em [src/services/apiConfig.js](src/services/apiConfig.js) preenchido antes de gerar o APK. A partir daí os tablets ficam sincronizados em tempo real: o que um faz (nova comanda, item entregue, comanda fechada) aparece nos outros na hora.

---

## 6. Login no app

Quando o app abrir:

1. Tela **"Quem está tentando acessar?"**
2. Clica em **ATENDENTE** (ou GERENTE)
3. Faz login com:

| Perfil | Username | Senha |
|--------|----------|-------|
| Atendente | `teste` | `teste123` |
| Gerente | `admin` | `admin123` |

---

## Problemas comuns

### "Network Error" ao fazer login

1. Confirma que a API está rodando (`npm run dev` em outra janela)
2. Confirma que o `adb reverse` foi feito (rode `npm run android:reverse`)
3. Se ainda não conectar, dá pra apontar o endereço do servidor pelo próprio app (na tela de login tem a opção de configurar a conexão, onde você digita o IP e a porta da API). Pra já deixar apontado por padrão, edita o `BUILT_IN_DEFAULT` em [src/services/apiConfig.js](src/services/apiConfig.js):
   ```js
   const BUILT_IN_DEFAULT = 'http://192.168.0.10:3000'; // IP do PC que roda a API, na mesma rede
   ```

### "Something went wrong" no Expo Go

1. Para o Expo (`Ctrl+C` no terminal)
2. Limpa o cache: `npx expo start --clear`
3. Reinicia o emulador (cold boot pelo Android Studio)

### Emulador sem internet / `adb reverse` não funciona

Faz **cold boot** do emulador:
1. Android Studio → Device Manager
2. No menu de 3 pontinhos ao lado do emulador, escolhe **Cold Boot Now** ou **Wipe Data**

### Tabelas não existem no banco

Você esqueceu de rodar o schema SQL. Volta no passo **3.2**.

### Tabelas existem mas falta a coluna `people`

Roda uma vez:
```bash
cd kiosque-api
node src/scripts/migrate_add_people.js
```

---

## Estrutura do projeto

```
.
├── App.js                     # Entry point do app mobile
├── app.json                   # Config Expo
├── package.json               # Deps do frontend
├── src/                       # Código do app mobile
│   ├── components/            # Botão, Input, BottomBar, etc
│   ├── contexts/              # AuthContext
│   ├── hooks/                 # useResponsive, useElapsedTime
│   ├── navigation/            # RootNavigator
│   ├── screens/               # Telas (Login, Orders, OrderDetail, etc)
│   ├── services/              # axios + socket.io + API services
│   └── theme/                 # Cores, tipografia, espaçamento
└── kiosque-api/               # Backend
    ├── SQL DO POSTGRES.sql    # Schema do banco
    ├── package.json           # Deps do backend
    ├── .env                   # NÃO COMMITAR (configs locais)
    └── src/
        ├── server.js          # Entry point da API
        ├── controllers/       # Lógica das rotas
        ├── routes/            # Definição de rotas
        ├── middlewares/       # JWT + RBAC
        ├── db/                # Pool do Postgres
        ├── scripts/           # seed.js, createTestUser.js, migrations
        └── uploads/products/  # Imagens dos produtos uploadadas
```

---

## Scripts úteis

### Frontend (raiz)

```bash
npm run android          # Inicia o app no emulador Android
npm run android:reverse  # Refaz só o adb reverse (sem reiniciar Expo)
npm start                # Inicia o Expo sem auto-selecionar plataforma
```

### Backend (`kiosque-api/`)

```bash
npm run dev              # Inicia a API com nodemon (recarrega ao salvar)
npm start                # Inicia a API sem reload
npm run seed             # Cria o usuário admin
node src/scripts/createTestUser.js              # Cria usuário "teste"
node src/scripts/migrate_add_people.js          # Adiciona coluna `people` no banco existente
```

---

## Endpoints da API

Documentação interativa (Swagger UI) em:
**<http://localhost:3000/api-docs>**

Principais:

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/users/attendant` | Auto-cadastro público, sem login (cria atendente ou gerente) |
| POST | `/api/auth/users` | Criar usuário pelo gerente já logado |
| GET | `/api/orders` | Listar comandas abertas (já com os itens) |
| GET | `/api/orders/closed` | Listar comandas fechadas |
| POST | `/api/orders` | Criar comanda |
| PATCH | `/api/orders/:id` | Editar comanda / entregar itens (`deliver_items`, `deliver_all`) |
| POST | `/api/orders/:id/close` | Fechar comanda |
| POST | `/api/orders/:id/reopen` | Reabrir comanda (manager) |
| GET | `/api/products` | Listar produtos |
| POST | `/api/products` | Criar produto (manager) |
| PUT | `/api/products/:id` | Editar produto (manager) |
| GET | `/api/categories` | Listar categorias |
| POST | `/api/categories` | Criar categoria (manager) |
| DELETE | `/api/categories/:id` | Excluir categoria (manager) |
| GET | `/api/tables` | Listar mesas |

> Importante: o cadastro de contas é aberto. Qualquer pessoa na rede consegue criar um usuário (inclusive gerente) pelo `/api/auth/users/attendant`, sem estar logada. A rota `/api/auth/users` é só a criação feita por um gerente já autenticado.

A lista completa, com todos os parâmetros e respostas, está no Swagger (`/api-docs`).
