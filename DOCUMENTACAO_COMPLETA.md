# Sistema de Tickets - Documentação Completa

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Instalação e Configuração](#instalação-e-configuração)
3. [Estrutura do Projeto](#estrutura-do-projeto)
4. [Funcionalidades](#funcionalidades)
5. [API Endpoints](#api-endpoints)
6. [Banco de Dados](#banco-de-dados)
7. [Autenticação e Autorização](#autenticação-e-autorização)
8. [Interface do Usuário](#interface-do-usuário)
9. [SLA (Service Level Agreement)](#sla-service-level-agreement)
10. [Relatórios e Analytics](#relatórios-e-analytics)
11. [Múltiplos Setores](#múltiplos-setores)
12. [Troubleshooting](#troubleshooting)

## 🎯 Visão Geral

O Sistema de Tickets é uma aplicação web completa para gerenciamento de tickets de suporte, desenvolvida em Node.js com Express, Sequelize ORM e interface frontend em HTML/CSS/JavaScript. O sistema suporta múltiplos setores por usuário, controle de SLA, relatórios e analytics.

### Características Principais
- ✅ Autenticação e autorização baseada em JWT
- ✅ Gerenciamento de usuários e setores
- ✅ Sistema de tickets com status e prioridades
- ✅ Controle de SLA (Service Level Agreement)
- ✅ Relatórios e analytics
- ✅ **Múltiplos setores por usuário** (NOVA FUNCIONALIDADE)
- ✅ Interface responsiva e intuitiva
- ✅ Backup automático do banco de dados

## 🚀 Instalação e Configuração

### Pré-requisitos
- Node.js (versão 14 ou superior)
- PostgreSQL ou SQLite
- npm ou yarn

### Passos de Instalação

1. **Clone o repositório**
```bash
git clone <url-do-repositorio>
cd sistema-tickets
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure o banco de dados**
```bash
# Copie o arquivo de exemplo
cp env.example .env

# Edite o arquivo .env com suas configurações
```

4. **Configure o banco de dados**
```bash
# Para PostgreSQL
npm run setup-postgres

# Para SQLite (padrão)
npm run setup-sqlite
```

5. **Sincronize o banco de dados com múltiplos setores**
```bash
node scripts/sync-multi-setores.js
```

6. **Inicie o servidor**
```bash
npm start
```

## 📁 Estrutura do Projeto

```
sistema-tickets/
├── config/                 # Configurações do banco de dados
├── middleware/             # Middlewares (autenticação, etc.)
├── models/                 # Modelos do Sequelize
│   ├── User.js            # Modelo de usuário
│   ├── Setor.js           # Modelo de setor
│   ├── UserSetor.js       # Modelo de relacionamento (NOVO)
│   ├── Ticket.js          # Modelo de ticket
│   ├── SLA.js             # Modelo de SLA
│   └── ...
├── routes/                 # Rotas da API
├── public/                 # Arquivos estáticos (frontend)
├── scripts/                # Scripts utilitários
└── server.js              # Arquivo principal do servidor
```

## ⚡ Funcionalidades

### Gestão de Usuários
- Registro e login de usuários
- Controle de acesso baseado em roles (admin/user)
- Alteração de senha
- Reset de senha

### Gestão de Setores
- Criação e gerenciamento de setores
- **Múltiplos setores por usuário** (NOVA FUNCIONALIDADE)
- Interface para atribuir/remover setores de usuários

### Gestão de Tickets
- Criação de tickets com título, descrição e prioridade
- Atualização de status (aberto, em progresso, fechado)
- Sistema de anotações
- Histórico de alterações

### Sistema de SLA
- Configuração de prazos por setor
- Monitoramento de prazos
- Alertas de vencimento

### Relatórios e Analytics
- Relatórios em CSV
- Analytics de performance
- Métricas de SLA

## 🔌 API Endpoints

### Autenticação
- `POST /api/v1/users/login` - Login
- `POST /api/v1/users/register` - Registro (admin)
- `POST /api/v1/users/reset-password` - Reset de senha

### Usuários
- `GET /api/v1/users` - Listar usuários (admin)
- `GET /api/v1/users/setor/:setor` - Usuários por setor
- `GET /api/v1/users/:userId/setores` - Setores de um usuário (NOVO)
- `POST /api/v1/users/:userId/setores` - Adicionar setores a usuário (NOVO)
- `DELETE /api/v1/users/:userId/setores/:setorId` - Remover setor de usuário (NOVO)
- `PUT /api/v1/users/:id/change-password` - Alterar senha

### Setores
- `GET /api/v1/setores` - Listar setores
- `POST /api/v1/setores` - Criar setor (admin)

### Tickets
- `GET /api/v1/tickets` - Listar tickets
- `POST /api/v1/tickets` - Criar ticket
- `GET /api/v1/tickets/:id` - Detalhes do ticket
- `PUT /api/v1/tickets/:id` - Atualizar ticket
- `GET /api/v1/tickets/sla/alertas` - Alertas de SLA

### Relatórios
- `GET /api/v1/reports/tickets` - Relatório de tickets (admin)

## 🗄️ Banco de Dados

### Tabelas Principais

#### Users
```sql
- id (INTEGER, PRIMARY KEY)
- username (STRING, UNIQUE)
- password (STRING, HASHED)
- role (STRING, DEFAULT: 'user')
- setor (STRING, DEFAULT: 'Geral') -- Setor principal (mantido para compatibilidade)
```

#### Setors
```sql
- id (INTEGER, PRIMARY KEY)
- nome (STRING, UNIQUE)
```

#### UserSetors (NOVA TABELA)
```sql
- id (INTEGER, PRIMARY KEY)
- userId (INTEGER, FOREIGN KEY)
- setorId (INTEGER, FOREIGN KEY)
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
```

#### Tickets
```sql
- id (INTEGER, PRIMARY KEY)
- titulo (STRING)
- descricao (TEXT)
- status (ENUM: 'aberto', 'em progresso', 'fechado')
- prioridade (ENUM: 'baixa', 'media', 'alta')
- setor (STRING)
- areaResponsavel (STRING)
- statusSLA (STRING)
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
```

### Relacionamentos
- **User ↔ Setor**: Relacionamento muitos-para-muitos através da tabela `UserSetors`
- **Setor ↔ SLA**: Relacionamento um-para-um
- **User ↔ Ticket**: Relacionamento um-para-muitos (criador)

## 🔐 Autenticação e Autorização

### JWT (JSON Web Tokens)
- Tokens com expiração de 1 hora
- Incluem informações do usuário e setores
- Middleware de autenticação em todas as rotas protegidas

### Roles
- **admin**: Acesso completo ao sistema
- **user**: Acesso limitado aos seus tickets e setores

### Permissões por Funcionalidade
- **Criar usuários**: Apenas admin
- **Gerenciar setores**: Apenas admin
- **Visualizar todos os tickets**: Apenas admin
- **Criar tickets**: Usuários logados
- **Editar próprios tickets**: Usuários logados

## 🎨 Interface do Usuário

### Páginas Principais
- **Login** (`/login.html`): Autenticação
- **Dashboard** (`/dashboard.html`): Visão geral dos tickets
- **Criar Ticket** (`/criar-ticket.html`): Formulário de criação
- **Detalhes do Ticket** (`/ticket-detalhes.html`): Visualização e edição
- **Criar Usuário** (`/admin-user-create.html`): Registro de usuários (admin)
- **Gerenciar Setores de Usuários** (`/gerenciar-setores-usuario.html`): **NOVA PÁGINA**

### Características da Interface
- Design responsivo com Bootstrap 5
- Ícones Font Awesome
- Filtros e busca em tempo real
- Paginação
- Alertas e notificações

## ⏰ SLA (Service Level Agreement)

### Configuração
- Prazos configuráveis por setor
- Alertas automáticos de vencimento
- Status de SLA: dentro do prazo, próximo vencimento, vencido

### Monitoramento
- Dashboard com alertas visuais
- API para consulta de status
- Relatórios de compliance

## 📊 Relatórios e Analytics

### Tipos de Relatório
- **Relatório de Tickets**: Exportação em CSV
- **Analytics**: Métricas de performance
- **Relatórios de SLA**: Compliance e vencimentos

### Filtros Disponíveis
- Por período
- Por setor
- Por status
- Por prioridade

## 🏢 Múltiplos Setores (NOVA FUNCIONALIDADE)

### Visão Geral
O sistema agora suporta que usuários pertençam a múltiplos setores, mantendo compatibilidade com o sistema anterior.

### Funcionalidades
- **Setor Principal**: Mantido para compatibilidade
- **Setores Adicionais**: Novos setores que o usuário pode acessar
- **Interface de Gerenciamento**: Página dedicada para administradores
- **API Completa**: Endpoints para gerenciar setores de usuários

### Como Usar

#### 1. Sincronizar Banco de Dados
```bash
node scripts/sync-multi-setores.js
```

#### 2. Testar Funcionalidade
```bash
node scripts/test-multi-setores.js
```

#### 3. Gerenciar Setores via Interface
1. Acesse como administrador
2. Vá para "Administração" → "Gerenciar Setores de Usuários"
3. Selecione um usuário
4. Adicione ou remova setores conforme necessário

#### 4. Gerenciar via API
```bash
# Adicionar setores a um usuário
POST /api/v1/users/1/setores
{
  "setorIds": [1, 2, 3]
}

# Remover um setor específico
DELETE /api/v1/users/1/setores/2

# Consultar setores de um usuário
GET /api/v1/users/1/setores
```

### Benefícios
- **Flexibilidade**: Usuários podem trabalhar em múltiplos setores
- **Compatibilidade**: Sistema anterior continua funcionando
- **Escalabilidade**: Fácil adição de novos setores
- **Controle**: Administradores podem gerenciar facilmente

## 🔧 Troubleshooting

### Problemas Comuns

#### Erro de Conexão com Banco
```bash
# Verificar configuração
node scripts/check-database.js

# Testar conexão PostgreSQL
node scripts/test-postgres-connection.js
```

#### Erro de Sincronização
```bash
# Forçar sincronização
node scripts/force-sync-database.js

# Verificar estrutura das tabelas
node scripts/check-table-structure.js
```

#### Problemas com Múltiplos Setores
```bash
# Testar funcionalidade
node scripts/test-multi-setores.js

# Verificar relacionamentos
node scripts/test-associations.js
```

### Logs e Debug
- Logs do servidor no console
- Verificar arquivos de log do banco
- Usar ferramentas de debug do Sequelize

### Backup e Recuperação
```bash
# Backup automático
node scripts/backup-sqlite.js

# Restaurar backup
# Copiar arquivo .sqlite da pasta backups/
```

## 📝 Changelog

### Versão 2.0 - Múltiplos Setores
- ✅ Adicionado suporte a múltiplos setores por usuário
- ✅ Nova tabela UserSetors para relacionamentos
- ✅ Interface de gerenciamento de setores
- ✅ API completa para gerenciar setores
- ✅ Mantida compatibilidade com sistema anterior
- ✅ Scripts de migração e teste

### Versão 1.0 - Funcionalidades Básicas
- ✅ Sistema de autenticação
- ✅ Gestão de tickets
- ✅ Sistema de SLA
- ✅ Relatórios básicos
- ✅ Interface responsiva

## 🤝 Contribuição

Para contribuir com o projeto:

1. Fork o repositório
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 📞 Suporte

Para suporte técnico ou dúvidas:
- Abra uma issue no GitHub
- Consulte a documentação
- Verifique os scripts de troubleshooting

---

**Desenvolvido com ❤️ para facilitar o gerenciamento de tickets e suporte técnico.**




