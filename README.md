# 🌳 Sistema de Tickets - Gestão Inteligente de Suporte

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18+-blue.svg)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13+-blue.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> Sistema completo de gerenciamento de tickets de suporte com notificações por email, múltiplos setores, SLA e analytics.

## 🎯 Visão Geral

O **Sistema de Tickets** é uma aplicação web moderna e robusta para gerenciamento de tickets de suporte técnico. Desenvolvido com Node.js, Express e PostgreSQL, oferece uma solução completa para empresas que precisam organizar e acompanhar solicitações de suporte.

### ✨ Características Principais

- 🔐 **Autenticação Segura** - JWT com controle de acesso por roles
- 🎫 **Gestão de Tickets** - Criação, acompanhamento e resolução
- 🏢 **Múltiplos Setores** - Suporte a diversos departamentos
- ⏰ **Sistema de SLA** - Controle de prazos e alertas automáticos
- 📧 **Notificações por Email** - Integração com Resend
- 📊 **Analytics e Relatórios** - Métricas de performance
- 🎨 **Interface Responsiva** - Bootstrap 5 com design moderno
- 🔒 **Segurança Avançada** - Rate limiting, CORS, Helmet

## 🚀 Funcionalidades

### 👥 Gestão de Usuários
- Registro e login seguro
- Controle de acesso (admin/user)
- Múltiplos setores por usuário
- Alteração de senha

### 🎫 Gestão de Tickets
- Criação com prioridades
- Acompanhamento de status
- Sistema de anotações
- Histórico de alterações
- Filtros e busca avançada

### 📧 Notificações Inteligentes
- Email automático ao criar ticket
- Template HTML profissional
- Notificação para todos os usuários do setor
- Integração com Resend

### 📊 Analytics e Relatórios
- Dashboard de produtividade
- Relatórios em CSV
- Métricas de SLA
- Análise de performance

## 🛠️ Tecnologias

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **Sequelize** - ORM para banco de dados
- **PostgreSQL** - Banco de dados principal
- **JWT** - Autenticação
- **Resend** - Serviço de email

### Frontend
- **HTML5** - Estrutura
- **CSS3** - Estilização
- **JavaScript ES6+** - Interatividade
- **Bootstrap 5** - Framework CSS
- **Font Awesome** - Ícones

### Segurança
- **Helmet** - Headers de segurança
- **Rate Limiting** - Proteção contra ataques
- **CORS** - Controle de origem
- **bcryptjs** - Hash de senhas

## 📋 Pré-requisitos

- Node.js 18+ 
- PostgreSQL 13+
- npm ou yarn
- Conta no Resend (para emails)

## 🔧 Instalação

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/sistema-tickets.git
cd sistema-tickets
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
```bash
cp env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
# Configurações do Servidor
PORT=3000
NODE_ENV=development

# Segurança
SECRET_KEY=sua_chave_secreta_aqui

# Banco de Dados PostgreSQL
DB_USER=postgres
DB_PASSWORD=sua_senha
DB_NAME=sistema_tickets
DB_HOST=localhost
DB_PORT=5432

# Email (Resend)
RESEND_API_KEY=re_sua_chave_api
FROM_EMAIL=noreply@sistema-tickets.com
FROM_NAME=Sistema de Tickets
```

### 4. Configure o banco de dados
```bash
# Execute a migração
node scripts/add-email-field.js
```

### 5. Inicie o servidor
```bash
npm start
```

O sistema estará disponível em: `http://localhost:3000`

## 👤 Acesso Inicial

- **URL**: http://localhost:3000
- **Usuário Admin**: admin
- **Senha**: adminpassword

## 📁 Estrutura do Projeto

```
sistema-tickets/
├── config/                 # Configurações
│   ├── database.js        # Configuração do banco
│   └── index.js           # Configurações gerais
├── middleware/             # Middlewares
│   └── auth.js            # Autenticação JWT
├── models/                 # Modelos Sequelize
│   ├── User.js            # Modelo de usuário
│   ├── Ticket.js          # Modelo de ticket
│   ├── Setor.js           # Modelo de setor
│   └── ...
├── routes/                 # Rotas da API
│   ├── users.js           # Rotas de usuários
│   ├── tickets.js         # Rotas de tickets
│   ├── setores.js         # Rotas de setores
│   └── ...
├── services/               # Serviços
│   ├── emailService.js    # Serviço de email
│   └── notificationService.js # Notificações
├── public/                 # Frontend
│   ├── css/               # Estilos
│   ├── js/                # JavaScript
│   └── *.html             # Páginas
├── scripts/                # Scripts utilitários
└── server.js              # Servidor principal
```

## 🔌 API Endpoints

### Autenticação
- `POST /api/v1/users/login` - Login
- `POST /api/v1/users/register` - Registro (admin)

### Usuários
- `GET /api/v1/users` - Listar usuários
- `PUT /api/v1/users/:id/change-password` - Alterar senha

### Tickets
- `GET /api/v1/tickets` - Listar tickets
- `POST /api/v1/tickets` - Criar ticket
- `GET /api/v1/tickets/:id` - Detalhes do ticket
- `PUT /api/v1/tickets/:id` - Atualizar ticket

### Setores
- `GET /api/v1/setores` - Listar setores
- `POST /api/v1/setores` - Criar setor (admin)
- `DELETE /api/v1/setores/:id` - Excluir setor (admin)

### Notificações
- `GET /api/v1/notifications/status` - Status do serviço
- `POST /api/v1/notifications/test` - Testar notificação

## 🚀 Deploy

### Deploy Local
```bash
npm start
```

### Deploy com PM2
```bash
npm install -g pm2
pm2 start ecosystem.config.js
```

### Deploy com Docker
```bash
docker-compose up -d
```

## 📧 Configuração de Email

### 1. Crie uma conta no Resend
- Acesse [resend.com](https://resend.com)
- Crie uma conta gratuita
- Obtenha sua API key

### 2. Configure as variáveis
```env
RESEND_API_KEY=re_sua_chave_aqui
FROM_EMAIL=seu-email@dominio.com
FROM_NAME=Sistema de Tickets
```

### 3. Teste a configuração
```bash
node scripts/test-email-notification.js
```

## 🔒 Segurança

- **Autenticação JWT** com expiração
- **Rate Limiting** para prevenir ataques
- **Headers de Segurança** com Helmet
- **Validação de Dados** com express-validator
- **Hash de Senhas** com bcryptjs
- **CORS** configurado adequadamente

## 📊 Monitoramento

- Logs detalhados no console
- Status do serviço via API
- Métricas de performance
- Alertas de SLA

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

- **Issues**: [GitHub Issues](https://github.com/seu-usuario/sistema-tickets/issues)
- **Documentação**: [Wiki do Projeto](https://github.com/seu-usuario/sistema-tickets/wiki)
- **Email**: suporte@sistema-tickets.com

## 🎯 Roadmap

- [ ] Notificações por WhatsApp
- [ ] API REST completa
- [ ] Dashboard mobile
- [ ] Integração com Slack
- [ ] Sistema de templates
- [ ] Backup automático

---

**Desenvolvido com ❤️ para facilitar o gerenciamento de tickets e suporte técnico.**

[![GitHub stars](https://img.shields.io/github/stars/seu-usuario/sistema-tickets.svg?style=social&label=Star)](https://github.com/seu-usuario/sistema-tickets)
[![GitHub forks](https://img.shields.io/github/forks/seu-usuario/sistema-tickets.svg?style=social&label=Fork)](https://github.com/seu-usuario/sistema-tickets/fork)

