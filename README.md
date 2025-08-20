# Sistema de Tickets

Sistema completo de gerenciamento de tickets com PostgreSQL, desenvolvido em Node.js e Express.

## 🚀 Funcionalidades

- ✅ **Gestão de Usuários** (com email obrigatório)
- ✅ **Gestão de Setores** 
- ✅ **Sistema de Tickets**
- ✅ **Controle de SLA**
- ✅ **Histórico de alterações**
- ✅ **Anotações em tickets**
- ✅ **Relatórios e analytics**

## 📋 Pré-requisitos

- Node.js (versão 16 ou superior)
- PostgreSQL (versão 12 ou superior)
- npm ou yarn

## 🛠️ Instalação

1. **Clone o repositório:**
```bash
git clone <url-do-repositorio>
cd sistema-tickets
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure o banco de dados:**
```bash
# Configure o arquivo .env com suas credenciais PostgreSQL
cp env.example .env
# Edite o arquivo .env com suas configurações
```

4. **Configure o banco PostgreSQL:**
```bash
npm run setup-db
npm run sync-db
npm run fix-admin
```

5. **Inicie o servidor:**
```bash
npm run dev
```

## ⚙️ Configuração

### Arquivo .env
```env
# Configurações do Servidor
PORT=3000
NODE_ENV=development

# Banco de Dados PostgreSQL
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui
DB_NAME=sistema_tickets_dev
DB_HOST=localhost
DB_PORT=5432

# Segurança
SECRET_KEY=sua_chave_secreta_aqui

# CORS
ALLOWED_ORIGINS=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# JWT
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
```

## 🎯 Scripts Disponíveis

- `npm run dev` - Inicia o servidor em modo desenvolvimento
- `npm start` - Inicia o servidor em modo produção
- `npm run setup-db` - Configura o banco de dados
- `npm run sync-db` - Sincroniza as tabelas
- `npm run fix-admin` - Corrige/cria usuário admin

## 👤 Usuário Padrão

- **Usuário:** `admin`
- **Senha:** `admin123`
- **Email:** `admin@sistema.local`

## 🌐 Acesso

Após iniciar o servidor, acesse:
- **URL:** `http://localhost:3000`
- **Login:** Use as credenciais admin acima

## 📁 Estrutura do Projeto

```
sistema-tickets/
├── config/          # Configurações do banco
├── middleware/      # Middlewares do Express
├── models/          # Modelos Sequelize
├── public/          # Arquivos estáticos (frontend)
├── routes/          # Rotas da API
├── scripts/         # Scripts de configuração
├── services/        # Serviços (email, etc.)
├── server.js        # Arquivo principal
└── package.json     # Dependências
```

## 🔧 Desenvolvimento

O projeto usa:
- **Backend:** Node.js + Express + Sequelize
- **Banco:** PostgreSQL
- **Frontend:** HTML + CSS + JavaScript vanilla
- **Autenticação:** JWT
- **Segurança:** Helmet, CORS, Rate Limiting

## 📝 Licença

Este projeto está sob a licença ISC.

