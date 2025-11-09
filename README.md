# Magalu Favoritos API

API REST para gerenciar clientes e produtos favoritos do Magalu.

## 📋 Descrição

Esta API permite que clientes do Magalu gerenciem seus produtos favoritos. A aplicação foi desenvolvida com foco em performance e escalabilidade, utilizando TypeScript, Node.js e PostgreSQL.

## 🚀 Tecnologias

- **Linguagem**: TypeScript (Node.js)
- **Banco de Dados**: PostgreSQL
- **Framework**: Express.js
- **Autenticação**: JWT (JSON Web Tokens)
- **Validação**: express-validator
- **Testes**: Jest

## 📦 Instalação

### Pré-requisitos

- Node.js (v20 ou superior)
- PostgreSQL (v12 ou superior)
- npm ou yarn

### Passos

1. Clone o repositório:
```bash
git clone https://github.com/devmeurer/magalu-favoritos-api.git
cd magalu-favoritos-api
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente criando um arquivo `.env` na raiz do projeto:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=magalu_favoritos
DB_USER=postgres
DB_PASSWORD=sua_senha

# JWT
JWT_SECRET=seu-secret-jwt-super-seguro
JWT_EXPIRES_IN=7d

# API Externa
PRODUCTS_API_URL=https://challenge-api.luizalabs.com/api/product

# Server
PORT=3000
NODE_ENV=development
```

4. Inicialize o banco de dados (o schema será criado automaticamente ao iniciar o servidor):
```bash
# Certifique-se de que o PostgreSQL está rodando
# Crie o banco de dados:
createdb magalu_favoritos
```

5. Execute a aplicação:

**Modo desenvolvimento:**
```bash
npm run dev
```

**Modo produção:**
```bash
npm run build
npm start
```

A API estará disponível em `http://localhost:3000`

## 🧪 Testes

Execute os testes:
```bash
npm test
```

Execute testes em modo watch:
```bash
npm run test:watch
```

Gere relatório de cobertura:
```bash
npm run test:coverage
```

## 📚 Endpoints

### Autenticação

#### Registrar Cliente
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "senha123"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "joao@example.com",
  "password": "senha123"
}
```

**Resposta:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "client": {
    "id": 1,
    "name": "João Silva",
    "email": "joao@example.com"
  }
}
```

### Clientes (Requer Autenticação)

#### Obter Perfil
```http
GET /api/clients/me
Authorization: Bearer {token}
```

#### Obter Cliente por ID
```http
GET /api/clients/:id
Authorization: Bearer {token}
```

#### Atualizar Perfil
```http
PUT /api/clients/me
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "João Silva Atualizado",
  "email": "novoemail@example.com"
}
```

#### Deletar Conta
```http
DELETE /api/clients/me
Authorization: Bearer {token}
```

### Favoritos (Requer Autenticação)

#### Listar Favoritos
```http
GET /api/favorites
Authorization: Bearer {token}
```

**Resposta:**
```json
{
  "count": 2,
  "favorites": [
    {
      "id": 1,
      "product": {
        "id": "1bf0f365-fbdd-4e21-9786-da459d5e5e5c",
        "title": "Produto Exemplo",
        "price": 99.99,
        "image": "https://example.com/image.jpg",
        "reviewScore": 4.5
      },
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Adicionar Favorito
```http
POST /api/favorites/:productId
Authorization: Bearer {token}
```

#### Remover Favorito
```http
DELETE /api/favorites/:productId
Authorization: Bearer {token}
```

### Health Check

```http
GET /health
```

## 🔒 Autenticação

Todas as rotas (exceto `/api/auth/register`, `/api/auth/login` e `/health`) requerem autenticação via JWT.

Inclua o token no header:
```
Authorization: Bearer {seu-token-jwt}
```

## 📊 Estrutura do Banco de Dados

### Tabela: clients
- `id` (SERIAL PRIMARY KEY)
- `name` (VARCHAR(255))
- `email` (VARCHAR(255) UNIQUE)
- `password_hash` (VARCHAR(255))
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Tabela: favorite_products
- `id` (SERIAL PRIMARY KEY)
- `client_id` (INTEGER REFERENCES clients(id))
- `product_id` (VARCHAR(255))
- `created_at` (TIMESTAMP)
- UNIQUE(client_id, product_id)

## 🎯 Funcionalidades Implementadas

✅ CRUD completo de clientes  
✅ Autenticação e autorização com JWT  
✅ Gerenciamento de produtos favoritos  
✅ Validação de produtos na API externa  
✅ Prevenção de duplicatas  
✅ Validação de dados de entrada  
✅ Índices no banco para performance  
✅ Testes automatizados  
✅ Tratamento de erros  

## 📝 Observações

- A API valida a existência de produtos na API externa antes de adicionar aos favoritos
- Cada cliente possui uma única lista de favoritos
- Produtos não podem ser duplicados na lista de favoritos
- A senha é armazenada com hash usando bcrypt
- O banco de dados é inicializado automaticamente com as tabelas necessárias

## 📄 Licença

Este projeto está sob a licença ISC.

## 👤 Autor

Desenvolvido para o desafio técnico do Magalu.
