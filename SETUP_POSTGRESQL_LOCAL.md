# 🗄️ Configuração PostgreSQL Local

## 📋 Pré-requisitos

1. **PostgreSQL instalado** no seu computador
2. **Node.js** versão 14 ou superior
3. **npm** ou **yarn**

## 🚀 Configuração Rápida

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto:

```env
# Configurações do Servidor
PORT=3000
NODE_ENV=development
FORCE_HTTPS=false

# 🔐 CONFIGURAÇÕES DE SEGURANÇA
SECRET_KEY=dev_secret_key_2025_sistema_tickets_local

# Configurações do Banco de Dados PostgreSQL Local
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=sistema_tickets_dev
DB_HOST=localhost
DB_PORT=5432

# 🌐 CONFIGURAÇÕES DE CORS
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# 🚦 CONFIGURAÇÕES DE RATE LIMITING
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# 🔑 CONFIGURAÇÕES DE JWT
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# 🔒 CONFIGURAÇÕES DE SENHA
MIN_PASSWORD_LENGTH=8
REQUIRE_PASSWORD_COMPLEXITY=false

# 📝 CONFIGURAÇÕES DE LOGGING
LOG_LEVEL=debug
LOG_FILE=logs/app.log

# 👤 CONFIGURAÇÕES DE ADMIN
ADMIN_PASSWORD=admin123

# 📧 CONFIGURAÇÕES DE EMAIL (OPCIONAL)
RESEND_API_KEY=re_sua_chave_api_aqui
FROM_EMAIL=noreply@localhost
FROM_NAME=Sistema de Tickets - Dev
```

### 3. Configurar Banco de Dados
```bash
# Configurar PostgreSQL local
npm run setup-db-local

# Sincronizar modelos com o banco
npm run sync-db
```

### 4. Iniciar Desenvolvimento
```bash
npm run dev
```

## 🔧 Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run setup-db-local` | Configura PostgreSQL local |
| `npm run sync-db` | Sincroniza modelos com banco |
| `npm run check-db` | Verifica status do banco |
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run postgres:test` | Testa conexão com PostgreSQL |

## 🐛 Solução de Problemas

### Erro: "connection refused"
- Verifique se o PostgreSQL está rodando
- Verifique se a porta 5432 está livre
- Verifique as credenciais no `.env`

### Erro: "database does not exist"
- Execute: `npm run setup-db-local`
- Verifique se o usuário tem permissões

### Erro: "permission denied"
- Verifique se o usuário `postgres` existe
- Verifique se a senha está correta
- Execute como administrador se necessário

## 📊 Verificação

Após a configuração, você pode acessar:

- **Frontend**: http://localhost:3000
- **API**: http://localhost:3000/api/v1/
- **Credenciais**: admin / admin123

## 🔄 Migração de SQLite (se necessário)

Se você tinha dados no SQLite e quer migrar:

```bash
# Migração segura
npm run migrate:safe

# Migração simples
npm run migrate:simple
```

## 📝 Notas

- O sistema agora usa **apenas PostgreSQL**
- SQLite foi completamente removido
- Todas as configurações estão otimizadas para desenvolvimento local
- Logs detalhados em desenvolvimento para facilitar debug

