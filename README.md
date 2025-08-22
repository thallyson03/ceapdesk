# Sistema de Tickets

Sistema completo de gerenciamento de tickets com PostgreSQL, desenvolvido em Node.js e Express.

## 🚀 Funcionalidades

- ✅ **Gestão de Usuários** (com email obrigatório)
- ✅ **Gestão de Setores** 
- ✅ **Sistema de Tickets** (com dados do cliente - CPF/CNPJ, nome e contato)
- ✅ **Controle de SLA** (excluindo feriados e finais de semana)
- ✅ **Histórico de alterações**
- ✅ **Anotações em tickets**
- ✅ **Relatórios e analytics**
- ✅ **Dashboard Gráfico Avançado** (com Chart.js)
- ✅ **Gestão de Assuntos** (dropdown para títulos de tickets)
- ✅ **Gestão de Feriados** (para cálculo de SLA)
- ✅ **Performance Analytics** (usuários e setores)

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
- `node scripts/add-client-fields.js` - Adiciona campos de cliente ao banco

## 📊 Dashboard Gráfico

O sistema agora inclui um dashboard gráfico avançado com visualizações interativas:

### **Funcionalidades do Dashboard**
- **Visão Geral**: Tendências temporais, distribuição por status, performance de SLA
- **Análise de Tickets**: Distribuição por prioridade e setor
- **Performance de Usuários**: Ranking e métricas detalhadas
- **Performance por Setor**: Análise de eficiência por área

### **Acesso**
- URL: `http://localhost:3000/dashboard-grafico.html`
- Acesso restrito a administradores
- Documentação completa: `DASHBOARD_GRAFICO_README.md`

### **Tecnologias**
- **Chart.js**: Gráficos interativos e responsivos
- **Bootstrap 5**: Interface moderna
- **APIs RESTful**: Dados em tempo real

## 🔄 Migração de Dados

Para adicionar os novos campos de cliente (CPF/CNPJ e nome), execute:

```bash
# Script automático (requer conexão com banco)
node scripts/add-client-fields.js

# Ou execute manualmente no seu banco de dados:
# PostgreSQL:
ALTER TABLE "Tickets" ADD COLUMN "cpfCnpj" VARCHAR(18);
ALTER TABLE "Tickets" ADD COLUMN "nomeCliente" VARCHAR(255);

# Oracle:
ALTER TABLE "Tickets" ADD "cpfCnpj" VARCHAR2(18);
ALTER TABLE "Tickets" ADD "nomeCliente" VARCHAR2(255);
```

Veja o arquivo `MIGRATION_CLIENT_FIELDS.md` para instruções detalhadas.

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

