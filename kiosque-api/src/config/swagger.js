'use strict'

// =============================================================
//  OpenAPI 3.0 — Comandou API
// =============================================================

const swaggerSpec = {
  openapi: '3.0.0',

  // -----------------------------------------------------------
  // Metadados
  // -----------------------------------------------------------
  info: {
    title:   'Comandou API',
    version: '1.0.0',
    description: `
## Sistema de gerenciamento de comandas — Quiosque

### Autenticação
Todas as rotas (exceto \`POST /auth/login\`) exigem token JWT no header:
\`\`\`
Authorization: Bearer <token>
\`\`\`
1. Faça \`POST /auth/login\` com suas credenciais
2. Copie o campo \`token\` da resposta
3. Clique em **Authorize** (cadeado) e cole o token no campo **BearerAuth**

### Perfis de acesso
| Perfil | Descrição |
|---|---|
| \`manager\` | Gerente — acesso total, incluindo cadastro de produtos e usuários |
| \`attendant\` | Atendente — gerencia comandas e consulta catálogo |

### Tempo real (Socket.IO)
O servidor emite eventos Socket.IO para todos os clientes conectados:

| Evento | Quando |
|---|---|
| \`order:created\` | Nova comanda criada |
| \`order:updated\` | Comanda editada |
| \`order:closed\` | Comanda fechada |
| \`order:deleted\` | Comanda excluída |

### Color status das comandas abertas
| Cor | Tempo desde a abertura |
|---|---|
| \`green\` | menos de 15 minutos |
| \`yellow\` | entre 15 e 30 minutos |
| \`red\` | mais de 30 minutos |
    `,
    contact: { name: 'Projeto Desenvolvimento Mobile — SATC' }
  },

  servers: [
    { url: 'http://localhost:3000/api', description: 'Desenvolvimento local' }
  ],

  // -----------------------------------------------------------
  // Tags (agrupamento no Swagger UI)
  // -----------------------------------------------------------
  tags: [
    { name: 'Auth',       description: 'Autenticação e gerenciamento de usuários' },
    { name: 'Orders',     description: 'Comandas — criação, edição e fechamento' },
    { name: 'Products',   description: 'Catálogo de produtos' },
    { name: 'Categories', description: 'Categorias (somente leitura via API)' },
    { name: 'Tables',     description: 'Mesas físicas' },
    { name: 'Misc',       description: 'Utilitários' }
  ],

  // -----------------------------------------------------------
  // Segurança global (todas as rotas exigem BearerAuth, exceto
  // as que sobrescrevem com  security: []  )
  // -----------------------------------------------------------
  security: [{ BearerAuth: [] }],

  // -----------------------------------------------------------
  // Componentes reutilizáveis
  // -----------------------------------------------------------
  components: {

    securitySchemes: {
      BearerAuth: {
        type:         'http',
        scheme:       'bearer',
        bearerFormat: 'JWT',
        description:  'Token JWT obtido no endpoint `POST /auth/login`'
      }
    },

    // ---- Schemas ----
    schemas: {

      // Erro genérico
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Mensagem de erro descritiva.' }
        }
      },

      // Mensagem de sucesso simples
      Message: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Operação realizada com sucesso.' }
        }
      },

      // ---- Usuário ----
      User: {
        type: 'object',
        properties: {
          id:         { type: 'integer',            example: 1 },
          username:   { type: 'string',             example: 'joao' },
          role:       { type: 'string', enum: ['manager', 'attendant'] },
          is_active:  { type: 'boolean',            example: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time', nullable: true }
        }
      },

      LoginRequest: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string', example: 'admin' },
          password: { type: 'string', example: 'admin123' }
        }
      },

      LoginResponse: {
        type: 'object',
        properties: {
          token:    { type: 'string', description: 'Token JWT — use em Authorization: Bearer <token>' },
          role:     { type: 'string', enum: ['manager', 'attendant'] },
          username: { type: 'string', example: 'admin' }
        }
      },

      CreateUserRequest: {
        type: 'object',
        required: ['username', 'password', 'role'],
        properties: {
          username: { type: 'string',  example: 'maria',      description: 'Deve ser único' },
          password: { type: 'string',  example: 'senha123',   description: 'Mínimo 6 caracteres recomendado' },
          role:     { type: 'string',  enum: ['manager', 'attendant'], example: 'attendant' }
        }
      },

      ChangePasswordRequest: {
        type: 'object',
        required: ['newPassword'],
        properties: {
          newPassword: { type: 'string', example: 'novaSenha456', description: 'Mínimo 6 caracteres' }
        }
      },

      // ---- Categoria ----
      Category: {
        type: 'object',
        properties: {
          id:   { type: 'integer', example: 1 },
          name: { type: 'string',  example: 'Bebidas' }
        }
      },

      // ---- Mesa ----
      Table: {
        type: 'object',
        properties: {
          id:        { type: 'integer', example: 1 },
          label:     { type: 'string',  example: 'Mesa 1' },
          is_active: { type: 'boolean', example: true }
        }
      },

      CreateTableRequest: {
        type: 'object',
        required: ['label'],
        properties: {
          label: { type: 'string', example: 'Mesa 4', description: 'Deve ser único' }
        }
      },

      UpdateTableRequest: {
        type: 'object',
        required: ['label'],
        properties: {
          label: { type: 'string', example: 'Balcão 2' }
        }
      },

      // ---- Produto ----
      Product: {
        type: 'object',
        properties: {
          id:            { type: 'integer',           example: 1 },
          name:          { type: 'string',            example: 'X-Burguer' },
          description:   { type: 'string',            example: 'Hambúrguer artesanal 180g', nullable: true },
          price:         { type: 'number', format: 'float', example: 18.90 },
          image:         { type: 'string', format: 'uri',   example: 'http://localhost:3000/uploads/products/1234.jpg', nullable: true },
          is_active:     { type: 'boolean',           example: true },
          created_at:    { type: 'string', format: 'date-time' },
          category_id:   { type: 'integer',           example: 1 },
          category_name: { type: 'string',            example: 'Lanches' }
        }
      },

      // Multipart usado em POST /products e PUT /products/:id
      CreateProductForm: {
        type: 'object',
        required: ['name', 'price', 'category_id'],
        properties: {
          name:        { type: 'string',  example: 'X-Burguer',              description: 'Nome do produto' },
          description: { type: 'string',  example: 'Hambúrguer artesanal',   description: 'Descrição opcional' },
          price:       { type: 'number',  example: 18.90,                    description: 'Preço em reais (>= 0)' },
          category_id: { type: 'integer', example: 1,                        description: 'ID da categoria' },
          image:       { type: 'string',  format: 'binary',                  description: 'Imagem do produto (JPEG, PNG, WebP, GIF — máx. 5 MB)' }
        }
      },

      UpdateProductForm: {
        type: 'object',
        description: 'Todos os campos são opcionais — envie apenas o que deseja alterar',
        properties: {
          name:        { type: 'string',  example: 'X-Bacon' },
          description: { type: 'string',  example: 'Com bacon crocante' },
          price:       { type: 'number',  example: 22.50 },
          category_id: { type: 'integer', example: 2 },
          image:       { type: 'string',  format: 'binary', description: 'Substitui a imagem atual (JPEG, PNG, WebP, GIF — máx. 5 MB)' }
        }
      },

      // ---- Order Item ----
      OrderItem: {
        type: 'object',
        properties: {
          id:            { type: 'integer',           example: 1 },
          product_id:    { type: 'integer',           example: 3 },
          product_name:  { type: 'string',            example: 'X-Burguer' },
          category_name: { type: 'string',            example: 'Lanches' },
          quantity:      { type: 'integer',           example: 2 },
          unit_price:    { type: 'number', format: 'float', example: 18.90, description: 'Preço no momento da venda (snapshot)' },
          notes:         { type: 'string',            example: 'sem cebola', nullable: true }
        }
      },

      AddItemInput: {
        type: 'object',
        required: ['product_id', 'quantity'],
        properties: {
          product_id: { type: 'integer', example: 1,           description: 'ID do produto (deve estar ativo)' },
          quantity:   { type: 'integer', minimum: 1, example: 2 },
          notes:      { type: 'string',  example: 'sem cebola', nullable: true }
        }
      },

      UpdateItemInput: {
        type: 'object',
        required: ['item_id'],
        description: 'Envie apenas os campos que deseja alterar em um item existente',
        properties: {
          item_id:  { type: 'integer', example: 5,             description: 'ID do item (order_item.id)' },
          quantity: { type: 'integer', minimum: 1, example: 3 },
          notes:    { type: 'string',  example: 'bem passado',  nullable: true }
        }
      },

      // ---- Comanda (resumo — usado em listagens) ----
      OrderSummary: {
        type: 'object',
        properties: {
          id:              { type: 'integer',           example: 7 },
          label:           { type: 'string',            example: 'João', nullable: true, description: 'Identificação livre: nome do cliente, mesa, etc.' },
          created_at:      { type: 'string', format: 'date-time' },
          closed_at:       { type: 'string', format: 'date-time', nullable: true },
          status:          { type: 'string', enum: ['open', 'closed'] },
          attendant:       { type: 'string',            example: 'maria',  description: 'Username do atendente que criou a comanda' },
          table_id:        { type: 'integer',           example: 1,        nullable: true },
          table_label:     { type: 'string',            example: 'Mesa 1', nullable: true },
          discount:        { type: 'number', format: 'float', example: 5.00 },
          total:           { type: 'number', format: 'float', example: 32.80, description: 'Calculado ao fechar: subtotal − desconto' },
          minutes_elapsed: { type: 'number',            example: 12.3, description: 'Minutos decorridos desde a abertura' },
          color_status:    {
            type: 'string',
            enum: ['green', 'yellow', 'red'],
            nullable: true,
            description: '`green` < 15 min | `yellow` 15–30 min | `red` > 30 min | `null` para comandas fechadas'
          },
          items_count:     { type: 'integer',           example: 3, description: 'Total de itens (somando quantities)' },
          subtotal:        { type: 'number', format: 'float', example: 37.80, description: 'Soma bruta (quantity × unit_price) antes do desconto' }
        }
      },

      // ---- Comanda detalhada (inclui array de itens) ----
      OrderDetail: {
        allOf: [
          { $ref: '#/components/schemas/OrderSummary' },
          {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: { $ref: '#/components/schemas/OrderItem' }
              }
            }
          }
        ]
      },

      CreateOrderRequest: {
        type: 'object',
        description: 'Itens são opcionais — é possível criar uma comanda vazia e adicionar itens depois via PATCH',
        properties: {
          label:    { type: 'string',  example: 'Mesa 3',  description: 'Identificação livre (nome, mesa, etc.)' },
          table_id: { type: 'integer', example: 1,         description: 'ID da mesa (opcional)' },
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/AddItemInput' },
            description: 'Itens iniciais da comanda'
          }
        }
      },

      UpdateOrderRequest: {
        type: 'object',
        description: 'Todos os campos são opcionais — envie apenas o que deseja alterar',
        properties: {
          label:    { type: 'string',  example: 'João da Silva' },
          table_id: { type: 'integer', example: 2,    nullable: true, description: 'null para desvincular mesa' },
          discount: { type: 'number',  example: 10.00, description: 'Desconto em reais (>= 0)' },
          add_items: {
            type: 'array',
            items: { $ref: '#/components/schemas/AddItemInput' },
            description: 'Itens a adicionar à comanda'
          },
          update_items: {
            type: 'array',
            items: { $ref: '#/components/schemas/UpdateItemInput' },
            description: 'Itens existentes a editar (por item_id)'
          },
          remove_items: {
            type: 'array',
            items: { type: 'integer' },
            example: [3, 7],
            description: 'IDs dos itens (order_item.id) a remover'
          }
        }
      }

    }, // fim schemas

    // ---- Respostas reutilizáveis ----
    responses: {
      Unauthorized: {
        description: 'Token JWT ausente ou inválido',
        content: { 'application/json': {
          schema:  { $ref: '#/components/schemas/Error' },
          example: { error: 'Token não fornecido' }
        }}
      },
      Forbidden: {
        description: 'Perfil sem permissão para esta operação',
        content: { 'application/json': {
          schema:  { $ref: '#/components/schemas/Error' },
          example: { error: 'Acesso não autorizado para este perfil.' }
        }}
      },
      NotFound: {
        description: 'Recurso não encontrado',
        content: { 'application/json': {
          schema:  { $ref: '#/components/schemas/Error' },
          example: { error: 'Recurso não encontrado.' }
        }}
      },
      Conflict: {
        description: 'Conflito — registro duplicado ou operação inválida no estado atual',
        content: { 'application/json': {
          schema: { $ref: '#/components/schemas/Error' }
        }}
      },
      InternalError: {
        description: 'Erro interno no servidor',
        content: { 'application/json': {
          schema:  { $ref: '#/components/schemas/Error' },
          example: { error: 'Erro interno no servidor.' }
        }}
      }
    }

  }, // fim components

  // -----------------------------------------------------------
  // Paths
  // -----------------------------------------------------------
  paths: {

    // =========================================================
    //  AUTH
    // =========================================================

    '/auth/login': {
      post: {
        tags:        ['Auth'],
        summary:     'Login',
        description: 'Autentica o usuário e retorna um token JWT. **Não requer autenticação prévia.**',
        security:    [],
        requestBody: {
          required: true,
          content: { 'application/json': {
            schema:  { $ref: '#/components/schemas/LoginRequest' },
            example: { username: 'admin', password: 'admin123' }
          }}
        },
        responses: {
          200: {
            description: 'Login bem-sucedido',
            content: { 'application/json': {
              schema:  { $ref: '#/components/schemas/LoginResponse' },
              example: { token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', role: 'manager', username: 'admin' }
            }}
          },
          400: { description: 'Campos obrigatórios ausentes', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Credenciais inválidas',        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'Credenciais inválidas.' } } } },
          403: { description: 'Usuário inativo',              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'Usuário inativo.' } } } },
          500: { $ref: '#/components/responses/InternalError' }
        }
      }
    },

    '/auth/users': {
      post: {
        tags:        ['Auth'],
        summary:     'Criar usuário',
        description: '**Somente gerente.** Cria um novo usuário atendente ou gerente.',
        requestBody: {
          required: true,
          content: { 'application/json': {
            schema:  { $ref: '#/components/schemas/CreateUserRequest' },
            example: { username: 'maria', password: 'senha123', role: 'attendant' }
          }}
        },
        responses: {
          201: {
            description: 'Usuário criado',
            content: { 'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string', example: 'Usuário maria criado com sucesso.' },
                  user:    { $ref: '#/components/schemas/User' }
                }
              }
            }}
          },
          400: { description: 'Campos inválidos ou role inexistente',   content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          409: { description: 'Username já em uso',                     content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'Username já está em uso.' } } } },
          500: { $ref: '#/components/responses/InternalError' }
        }
      },
      get: {
        tags:        ['Auth'],
        summary:     'Listar usuários',
        description: '**Somente gerente.** Retorna todos os usuários cadastrados (sem expor senha).',
        responses: {
          200: {
            description: 'Lista de usuários',
            content: { 'application/json': {
              schema: {
                type: 'object',
                properties: {
                  total: { type: 'integer', example: 3 },
                  users: { type: 'array', items: { $ref: '#/components/schemas/User' } }
                }
              }
            }}
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          500: { $ref: '#/components/responses/InternalError' }
        }
      }
    },

    '/auth/users/{id}': {
      delete: {
        tags:        ['Auth'],
        summary:     'Desativar usuário',
        description: '**Somente gerente.** Realiza soft-delete (desativa o usuário). O registro é preservado para integridade das comandas históricas.',
        parameters: [{
          name: 'id', in: 'path', required: true,
          schema: { type: 'integer', example: 2 },
          description: 'ID do usuário'
        }],
        responses: {
          200: {
            description: 'Usuário desativado',
            content: { 'application/json': {
              schema: { $ref: '#/components/schemas/Message' },
              example: { message: 'Usuário maria desativado com sucesso.' }
            }}
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { description: 'Usuário não encontrado ou já inativo', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          500: { $ref: '#/components/responses/InternalError' }
        }
      }
    },

    '/auth/users/{id}/password': {
      patch: {
        tags:        ['Auth'],
        summary:     'Alterar senha de usuário',
        description: '**Somente gerente.** Redefine a senha de qualquer usuário.',
        parameters: [{
          name: 'id', in: 'path', required: true,
          schema: { type: 'integer', example: 2 },
          description: 'ID do usuário'
        }],
        requestBody: {
          required: true,
          content: { 'application/json': {
            schema:  { $ref: '#/components/schemas/ChangePasswordRequest' },
            example: { newPassword: 'novaSenha456' }
          }}
        },
        responses: {
          200: {
            description: 'Senha alterada',
            content: { 'application/json': {
              schema:  { $ref: '#/components/schemas/Message' },
              example: { message: 'Senha do usuário maria alterada com sucesso.' }
            }}
          },
          400: { description: 'newPassword ausente ou muito curta',    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/InternalError' }
        }
      }
    },

    // =========================================================
    //  CATEGORIES
    // =========================================================

    '/categories': {
      get: {
        tags:        ['Categories'],
        summary:     'Listar categorias',
        description: 'Retorna todas as categorias de produtos. Categorias são pré-cadastradas internamente e não possuem gerenciamento via UI.',
        responses: {
          200: {
            description: 'Lista de categorias',
            content: { 'application/json': {
              schema: {
                type: 'object',
                properties: {
                  total:      { type: 'integer', example: 5 },
                  categories: { type: 'array', items: { $ref: '#/components/schemas/Category' } }
                }
              },
              example: {
                total: 5,
                categories: [
                  { id: 1, name: 'Bebidas' },
                  { id: 2, name: 'Combos' },
                  { id: 3, name: 'Lanches' },
                  { id: 4, name: 'Porções' },
                  { id: 5, name: 'Sobremesas' }
                ]
              }
            }}
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          500: { $ref: '#/components/responses/InternalError' }
        }
      }
    },

    // =========================================================
    //  TABLES
    // =========================================================

    '/tables': {
      get: {
        tags:        ['Tables'],
        summary:     'Listar mesas',
        description: 'Retorna todas as mesas cadastradas (ativas e inativas).',
        responses: {
          200: {
            description: 'Lista de mesas',
            content: { 'application/json': {
              schema: {
                type: 'object',
                properties: {
                  total:  { type: 'integer', example: 3 },
                  tables: { type: 'array', items: { $ref: '#/components/schemas/Table' } }
                }
              }
            }}
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          500: { $ref: '#/components/responses/InternalError' }
        }
      },
      post: {
        tags:        ['Tables'],
        summary:     'Criar mesa',
        description: '**Somente gerente.**',
        requestBody: {
          required: true,
          content: { 'application/json': {
            schema:  { $ref: '#/components/schemas/CreateTableRequest' },
            example: { label: 'Mesa 4' }
          }}
        },
        responses: {
          201: {
            description: 'Mesa criada',
            content: { 'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                  table:   { $ref: '#/components/schemas/Table' }
                }
              }
            }}
          },
          400: { description: 'label ausente',             content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          409: { description: 'Mesa com esse nome já existe', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'Já existe uma mesa com esse nome.' } } } },
          500: { $ref: '#/components/responses/InternalError' }
        }
      }
    },

    '/tables/{id}': {
      patch: {
        tags:        ['Tables'],
        summary:     'Renomear mesa',
        description: '**Somente gerente.**',
        parameters: [{
          name: 'id', in: 'path', required: true,
          schema: { type: 'integer', example: 1 }, description: 'ID da mesa'
        }],
        requestBody: {
          required: true,
          content: { 'application/json': {
            schema:  { $ref: '#/components/schemas/UpdateTableRequest' },
            example: { label: 'Balcão' }
          }}
        },
        responses: {
          200: {
            description: 'Mesa atualizada',
            content: { 'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                  table:   { $ref: '#/components/schemas/Table' }
                }
              }
            }}
          },
          400: { description: 'label ausente',               content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          409: { description: 'Nome já usado por outra mesa', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          500: { $ref: '#/components/responses/InternalError' }
        }
      },
      delete: {
        tags:        ['Tables'],
        summary:     'Excluir mesa',
        description: '**Somente gerente.** A exclusão é bloqueada se houver comandas abertas vinculadas à mesa (proteção via trigger no banco).',
        parameters: [{
          name: 'id', in: 'path', required: true,
          schema: { type: 'integer', example: 1 }, description: 'ID da mesa'
        }],
        responses: {
          200: {
            description: 'Mesa excluída',
            content: { 'application/json': {
              schema:  { $ref: '#/components/schemas/Message' },
              example: { message: 'Mesa excluída com sucesso.' }
            }}
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          409: { description: 'Existem comandas abertas vinculadas à mesa', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'Não é possível excluir a mesa "Mesa 1" pois há comandas abertas vinculadas a ela.' } } } },
          500: { $ref: '#/components/responses/InternalError' }
        }
      }
    },

    '/tables/{id}/toggle': {
      patch: {
        tags:        ['Tables'],
        summary:     'Ativar / desativar mesa',
        description: '**Somente gerente.** Alterna o campo `is_active` da mesa.',
        parameters: [{
          name: 'id', in: 'path', required: true,
          schema: { type: 'integer', example: 1 }, description: 'ID da mesa'
        }],
        responses: {
          200: {
            description: 'Status alterado',
            content: { 'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                  table:   { $ref: '#/components/schemas/Table' }
                }
              }
            }}
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/InternalError' }
        }
      }
    },

    // =========================================================
    //  PRODUCTS
    // =========================================================

    '/products': {
      get: {
        tags:        ['Products'],
        summary:     'Listar produtos',
        description: 'Por padrão retorna apenas produtos **ativos**. Use `?active=all` para incluir inativos (gerente). Itens inativos ainda aparecem em comandas históricas mas não podem ser adicionados a novas.',
        parameters: [
          {
            name: 'search', in: 'query', required: false,
            schema: { type: 'string', example: 'bana' },
            description: 'Busca por nome. **Parcial, case-insensitive e acento-insensitive** (via `unaccent`). `bana` encontra "Banana", "Bananada", "Suco de Banana"; `cafe` encontra "Café", "Café com leite".'
          },
          {
            name: 'category_id', in: 'query', required: false,
            schema: { type: 'integer', example: 1 },
            description: 'Filtrar por categoria (pode ser combinado com `search`)'
          },
          {
            name: 'active', in: 'query', required: false,
            schema: { type: 'string', enum: ['all'], example: 'all' },
            description: 'Passe `all` para incluir produtos inativos'
          }
        ],
        responses: {
          200: {
            description: 'Lista de produtos',
            content: { 'application/json': {
              schema: {
                type: 'object',
                properties: {
                  total:    { type: 'integer', example: 10 },
                  products: { type: 'array', items: { $ref: '#/components/schemas/Product' } }
                }
              }
            }}
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          500: { $ref: '#/components/responses/InternalError' }
        }
      },
      post: {
        tags:        ['Products'],
        summary:     'Criar produto',
        description: '**Somente gerente.** Envia `multipart/form-data`. A imagem é opcional; se enviada, deve ser JPEG, PNG, WebP ou GIF (máx. 5 MB).',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema:   { $ref: '#/components/schemas/CreateProductForm' },
              encoding: { image: { contentType: 'image/jpeg, image/png, image/webp, image/gif' } }
            }
          }
        },
        responses: {
          201: {
            description: 'Produto criado',
            content: { 'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                  product: { $ref: '#/components/schemas/Product' }
                }
              }
            }}
          },
          400: { description: 'Campos obrigatórios ausentes, preço inválido, category_id inexistente ou tipo de arquivo inválido', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          500: { $ref: '#/components/responses/InternalError' }
        }
      }
    },

    '/products/{id}': {
      get: {
        tags:        ['Products'],
        summary:     'Buscar produto por ID',
        parameters: [{
          name: 'id', in: 'path', required: true,
          schema: { type: 'integer', example: 1 }, description: 'ID do produto'
        }],
        responses: {
          200: {
            description: 'Produto encontrado',
            content: { 'application/json': {
              schema: {
                type: 'object',
                properties: { product: { $ref: '#/components/schemas/Product' } }
              }
            }}
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/InternalError' }
        }
      },
      put: {
        tags:        ['Products'],
        summary:     'Editar produto',
        description: '**Somente gerente.** Todos os campos são opcionais. Para substituir a imagem, envie o arquivo no campo `image`; caso contrário, a imagem atual é mantida.',
        parameters: [{
          name: 'id', in: 'path', required: true,
          schema: { type: 'integer', example: 1 }, description: 'ID do produto'
        }],
        requestBody: {
          required: false,
          content: {
            'multipart/form-data': {
              schema:   { $ref: '#/components/schemas/UpdateProductForm' },
              encoding: { image: { contentType: 'image/jpeg, image/png, image/webp, image/gif' } }
            }
          }
        },
        responses: {
          200: {
            description: 'Produto atualizado',
            content: { 'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                  product: { $ref: '#/components/schemas/Product' }
                }
              }
            }}
          },
          400: { description: 'Preço inválido, category_id inexistente ou tipo de arquivo inválido', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/InternalError' }
        }
      },
      delete: {
        tags:        ['Products'],
        summary:     'Desativar produto (soft delete)',
        description: '**Somente gerente.** Marca o produto como inativo (`is_active = false`). O produto **não é excluído** do banco para preservar o histórico de comandas. Produtos inativos não podem ser adicionados a novas comandas. Para reativar, use `PATCH /products/{id}/restore`.',
        parameters: [{
          name: 'id', in: 'path', required: true,
          schema: { type: 'integer', example: 1 }, description: 'ID do produto'
        }],
        responses: {
          200: {
            description: 'Produto desativado',
            content: { 'application/json': {
              schema:  { $ref: '#/components/schemas/Message' },
              example: { message: 'Produto "X-Burguer" desativado com sucesso.' }
            }}
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { description: 'Produto não encontrado ou já inativo', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          500: { $ref: '#/components/responses/InternalError' }
        }
      }
    },

    '/products/{id}/restore': {
      patch: {
        tags:        ['Products'],
        summary:     'Reativar produto',
        description: '**Somente gerente.** Reativa um produto que foi desativado (`is_active = true`).',
        parameters: [{
          name: 'id', in: 'path', required: true,
          schema: { type: 'integer', example: 1 }, description: 'ID do produto'
        }],
        responses: {
          200: {
            description: 'Produto reativado',
            content: { 'application/json': {
              schema:  { $ref: '#/components/schemas/Message' },
              example: { message: 'Produto "X-Burguer" reativado com sucesso.' }
            }}
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { description: 'Produto não encontrado ou já ativo', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          500: { $ref: '#/components/responses/InternalError' }
        }
      }
    },

    // =========================================================
    //  ORDERS
    // =========================================================

    '/orders': {
      get: {
        tags:        ['Orders'],
        summary:     'Listar comandas abertas (paginado)',
        description: `Retorna comandas com status \`open\`, ordenadas da mais antiga para a mais nova. Inclui \`color_status\`, \`minutes_elapsed\`, \`items_count\` e \`subtotal\` para exibição resumida nos tablets.

Count total e dados são buscados em paralelo para menor latência.`,
        parameters: [
          {
            name: 'page', in: 'query', required: false,
            schema: { type: 'integer', minimum: 1, default: 1, example: 1 },
            description: 'Página atual (começa em 1)'
          },
          {
            name: 'limit', in: 'query', required: false,
            schema: { type: 'integer', minimum: 1, maximum: 200, default: 50, example: 50 },
            description: 'Itens por página (máx. 200)'
          }
        ],
        responses: {
          200: {
            description: 'Página de comandas abertas',
            content: { 'application/json': {
              schema: {
                type: 'object',
                properties: {
                  page:        { type: 'integer', example: 1 },
                  limit:       { type: 'integer', example: 50 },
                  total:       { type: 'integer', example: 8, description: 'Total de comandas abertas' },
                  total_pages: { type: 'integer', example: 1 },
                  has_prev:    { type: 'boolean', example: false },
                  has_next:    { type: 'boolean', example: false },
                  orders:      { type: 'array', items: { $ref: '#/components/schemas/OrderSummary' } }
                }
              },
              example: {
                page: 1, limit: 50, total: 8,
                total_pages: 1, has_prev: false, has_next: false,
                orders: []
              }
            }}
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          500: { $ref: '#/components/responses/InternalError' }
        }
      },
      post: {
        tags:        ['Orders'],
        summary:     'Criar comanda',
        description: 'Cria uma nova comanda para o usuário autenticado. Os itens são opcionais: é possível criar a comanda vazia e adicionar itens depois via `PATCH /orders/{id}`. O preço de cada item é capturado como **snapshot** do preço atual do produto — alterações futuras no produto não afetam a comanda.',
        requestBody: {
          required: false,
          content: { 'application/json': {
            schema:  { $ref: '#/components/schemas/CreateOrderRequest' },
            example: {
              label:    'Mesa 2',
              table_id: 1,
              items: [
                { product_id: 3, quantity: 2, notes: 'sem cebola' },
                { product_id: 5, quantity: 1 }
              ]
            }
          }}
        },
        responses: {
          201: {
            description: 'Comanda criada — evento `order:created` emitido via Socket.IO',
            content: { 'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string', example: 'Comanda criada com sucesso.' },
                  order:   { $ref: '#/components/schemas/OrderDetail' }
                }
              }
            }}
          },
          400: { description: 'Produto inativo, quantity inválida ou product_id inexistente', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          500: { $ref: '#/components/responses/InternalError' }
        }
      }
    },

    '/orders/closed': {
      get: {
        tags:        ['Orders'],
        summary:     'Listar comandas fechadas (paginado)',
        description: `Retorna comandas com status \`closed\` de forma paginada.

**Padrão:** exibe as do **dia atual**. Passe \`?date=YYYY-MM-DD\` para consultar qualquer outro dia.

Count total e dados são buscados em paralelo para menor latência.`,
        parameters: [
          {
            name: 'page', in: 'query', required: false,
            schema: { type: 'integer', minimum: 1, default: 1, example: 1 },
            description: 'Página atual (começa em 1)'
          },
          {
            name: 'limit', in: 'query', required: false,
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 20, example: 20 },
            description: 'Itens por página (máx. 100)'
          },
          {
            name: 'date', in: 'query', required: false,
            schema: { type: 'string', format: 'date', example: '2025-05-23' },
            description: 'Dia a consultar no formato `YYYY-MM-DD`. Omitir retorna o dia atual.'
          }
        ],
        responses: {
          200: {
            description: 'Página de comandas fechadas',
            content: { 'application/json': {
              schema: {
                type: 'object',
                properties: {
                  page:        { type: 'integer', example: 1 },
                  limit:       { type: 'integer', example: 20 },
                  total:       { type: 'integer', example: 47, description: 'Total de registros no dia filtrado' },
                  total_pages: { type: 'integer', example: 3 },
                  has_prev:    { type: 'boolean', example: false },
                  has_next:    { type: 'boolean', example: true },
                  orders:      { type: 'array', items: { $ref: '#/components/schemas/OrderSummary' } }
                }
              },
              example: {
                page: 1, limit: 20, total: 47,
                total_pages: 3, has_prev: false, has_next: true,
                orders: []
              }
            }}
          },
          400: {
            description: 'Formato de date inválido',
            content: { 'application/json': {
              schema:  { $ref: '#/components/schemas/Error' },
              example: { error: 'date deve estar no formato YYYY-MM-DD.' }
            }}
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          500: { $ref: '#/components/responses/InternalError' }
        }
      }
    },

    '/orders/{id}': {
      get: {
        tags:        ['Orders'],
        summary:     'Buscar comanda por ID',
        description: 'Retorna a comanda com todos os seus itens detalhados.',
        parameters: [{
          name: 'id', in: 'path', required: true,
          schema: { type: 'integer', example: 7 }, description: 'ID da comanda'
        }],
        responses: {
          200: {
            description: 'Comanda encontrada',
            content: { 'application/json': {
              schema: {
                type: 'object',
                properties: { order: { $ref: '#/components/schemas/OrderDetail' } }
              }
            }}
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/InternalError' }
        }
      },
      patch: {
        tags:        ['Orders'],
        summary:     'Editar comanda aberta',
        description: `Edição atômica (transação) de uma comanda aberta. Permite em uma única requisição:
- Alterar \`label\` e/ou \`table_id\`
- Definir \`discount\` (valor em reais)
- Adicionar itens (\`add_items\`)
- Atualizar quantity/notes de itens existentes (\`update_items\`)
- Remover itens (\`remove_items\`)

Todos os campos são opcionais — envie apenas o que precisar alterar.

Emite evento **\`order:updated\`** via Socket.IO.`,
        parameters: [{
          name: 'id', in: 'path', required: true,
          schema: { type: 'integer', example: 7 }, description: 'ID da comanda'
        }],
        requestBody: {
          required: false,
          content: { 'application/json': {
            schema:  { $ref: '#/components/schemas/UpdateOrderRequest' },
            example: {
              discount: 5.00,
              add_items: [{ product_id: 2, quantity: 1, notes: 'gelada' }],
              update_items: [{ item_id: 3, quantity: 3 }],
              remove_items: [8]
            }
          }}
        },
        responses: {
          200: {
            description: 'Comanda atualizada — evento `order:updated` emitido via Socket.IO',
            content: { 'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string', example: 'Comanda atualizada.' },
                  order:   { $ref: '#/components/schemas/OrderDetail' }
                }
              }
            }}
          },
          400: { description: 'Produto inativo, quantity < 1 ou discount inválido', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
          409: { description: 'Comanda já está fechada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'Comanda já está fechada.' } } } },
          500: { $ref: '#/components/responses/InternalError' }
        }
      },
      delete: {
        tags:        ['Orders'],
        summary:     'Excluir comanda',
        description: 'Exclui permanentemente uma comanda **aberta** e todos os seus itens (ON DELETE CASCADE). Comandas fechadas não podem ser excluídas. Emite evento **`order:deleted`** via Socket.IO.',
        parameters: [{
          name: 'id', in: 'path', required: true,
          schema: { type: 'integer', example: 7 }, description: 'ID da comanda'
        }],
        responses: {
          200: {
            description: 'Comanda excluída — evento `order:deleted` emitido via Socket.IO',
            content: { 'application/json': {
              schema:  { $ref: '#/components/schemas/Message' },
              example: { message: 'Comanda excluída.' }
            }}
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { description: 'Comanda não encontrada ou já fechada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          500: { $ref: '#/components/responses/InternalError' }
        }
      }
    },

    '/orders/{id}/close': {
      post: {
        tags:        ['Orders'],
        summary:     'Fechar comanda',
        description: `Fecha a comanda e calcula o **total final** automaticamente via trigger no banco:

\`total = MAX(0, SOMA(quantity × unit_price) − discount)\`

Após fechada, a comanda:
- Não pode ter itens adicionados, editados ou removidos
- Aparece em \`GET /orders/closed\` durante o restante do dia
- Emite evento **\`order:closed\`** via Socket.IO`,
        parameters: [{
          name: 'id', in: 'path', required: true,
          schema: { type: 'integer', example: 7 }, description: 'ID da comanda'
        }],
        responses: {
          200: {
            description: 'Comanda fechada — evento `order:closed` emitido via Socket.IO',
            content: { 'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string', example: 'Comanda fechada com sucesso.' },
                  order:   { $ref: '#/components/schemas/OrderSummary' }
                }
              }
            }}
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { description: 'Comanda não encontrada ou já fechada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          500: { $ref: '#/components/responses/InternalError' }
        }
      }
    },

    // =========================================================
    //  MISC
    // =========================================================

    '/me': {
      get: {
        tags:        ['Misc'],
        summary:     'Perfil do usuário logado',
        description: 'Retorna o payload decodificado do token JWT. Útil para o front-end verificar o perfil e o ID do usuário autenticado sem nova consulta ao banco.',
        responses: {
          200: {
            description: 'Dados do token',
            content: { 'application/json': {
              schema: {
                type: 'object',
                properties: {
                  user: {
                    type: 'object',
                    properties: {
                      id:       { type: 'integer', example: 1 },
                      username: { type: 'string',  example: 'admin' },
                      role:     { type: 'string',  enum: ['manager', 'attendant'] },
                      iat:      { type: 'integer', description: 'Issued at (Unix timestamp)' },
                      exp:      { type: 'integer', description: 'Expiration (Unix timestamp)' }
                    }
                  }
                }
              }
            }}
          },
          401: { $ref: '#/components/responses/Unauthorized' }
        }
      }
    }

  } // fim paths

}

module.exports = swaggerSpec
