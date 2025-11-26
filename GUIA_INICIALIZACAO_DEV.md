# 🚀 Guia de Inicialização - Ambiente de Desenvolvimento

Guia completo para configurar e iniciar o Sistema de Tickets no ambiente de desenvolvimento.

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

### **Obrigatórios:**
- ✅ **Node.js** versão 16 ou superior ([Download](https://nodejs.org/))
- ✅ **PostgreSQL** versão 12 ou superior ([Download](https://www.postgresql.org/download/))
- ✅ **npm** (vem com Node.js) ou **yarn**

### **Verificar Instalações:**
```bash
node --version    # Deve ser v16 ou superior
npm --version     # Deve ser v7 ou superior
psql --version    # Deve ser PostgreSQL 12 ou superior
```

---

## 🛠️ Passo a Passo

### **1. Clonar/Obter o Projeto**

Se você já tem o projeto:
```bash
cd sistema-tickets
```

Se precisa clonar:
```bash
git clone <url-do-repositorio>
cd sistema-tickets
```

---

### **2. Instalar Dependências**

```bash
npm install
```

Isso instalará todas as dependências listadas no `package.json`:
- Express, Sequelize, JWT, bcrypt, etc.
- Nodemon (para desenvolvimento)

**Tempo estimado:** 1-3 minutos

---

### **3. Configurar PostgreSQL**

#### **3.1. Iniciar PostgreSQL**

**Windows:**
```bash
# Verificar se o serviço está rodando
# Abra "Serviços" e verifique "postgresql-x64-XX"

# Ou inicie manualmente:
net start postgresql-x64-14  # Ajuste a versão
```

**Linux/Mac:**
```bash
# Verificar status
sudo systemctl status postgresql

# Iniciar se necessário
sudo systemctl start postgresql
```

#### **3.2. Criar Banco de Dados (Opcional)**

Se preferir criar manualmente:
```bash
# Conectar ao PostgreSQL
psql -U postgres

# Criar banco de dados
CREATE DATABASE sistema_tickets_dev;

# Sair
\q
```

**OU** deixe o script criar automaticamente (próximo passo).

---

### **4. Configurar Variáveis de Ambiente**

#### **4.1. Criar Arquivo .env**

```bash
# Copiar arquivo de exemplo
cp env.example .env
```

#### **4.2. Editar Arquivo .env**

Abra o arquivo `.env` e configure:

```env
# Configurações do Servidor
PORT=3000
NODE_ENV=development
FORCE_HTTPS=false

# 🔐 CONFIGURAÇÕES DE SEGURANÇA (OBRIGATÓRIAS)
# Gere uma chave secreta forte:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
SECRET_KEY=dev_secret_key_2025_sistema_tickets_local_development_only

# Configurações do Banco de Dados PostgreSQL
DB_USER=postgres
DB_PASSWORD=sua_senha_postgres_aqui
DB_NAME=sistema_tickets_dev
DB_HOST=localhost
DB_PORT=5432

# 🌐 CONFIGURAÇÕES DE CORS
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# 🚦 CONFIGURAÇÕES DE RATE LIMITING
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# 🔑 CONFIGURAÇÕES DE JWT
JWT_EXPIRES_IN=6mo
JWT_REFRESH_EXPIRES_IN=1y

# 🔒 CONFIGURAÇÕES DE SENHA
MIN_PASSWORD_LENGTH=8
REQUIRE_PASSWORD_COMPLEXITY=false

# 📝 CONFIGURAÇÕES DE LOGGING
LOG_LEVEL=info
LOG_FILE=logs/app.log

# 👤 CONFIGURAÇÕES DE ADMIN
ADMIN_PASSWORD=admin123

# 📧 CONFIGURAÇÕES DE EMAIL (OPCIONAL - pode deixar vazio)
RESEND_API_KEY=
FROM_EMAIL=
FROM_NAME=Sistema de Tickets
```

**⚠️ IMPORTANTE:**
- Substitua `sua_senha_postgres_aqui` pela senha do seu PostgreSQL
- Se não tiver senha, deixe vazio ou use `postgres` (padrão)
- Gere uma `SECRET_KEY` forte para produção

**Gerar SECRET_KEY:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

### **5. Configurar Banco de Dados**

Execute os scripts de setup na ordem:

```bash
# 1. Configurar banco e criar usuário admin
npm run setup-db

# 2. Sincronizar tabelas do banco
npm run sync-db

# 3. Corrigir/criar usuário admin
npm run fix-admin
```

**O que cada script faz:**
- `setup-db`: Cria banco de dados e usuário admin inicial
- `sync-db`: Cria todas as tabelas (Users, Tickets, Setores, etc.)
- `fix-admin`: Garante que o usuário admin existe e está correto

**Tempo estimado:** 1-2 minutos

---

### **6. Iniciar Servidor de Desenvolvimento**

```bash
npm run dev
```

Isso iniciará o servidor com **nodemon** (reinicia automaticamente ao salvar arquivos).

**Saída esperada:**
```
Servidor rodando na porta 3000
Banco de dados conectado com sucesso
```

**OU** se preferir modo produção (sem auto-reload):
```bash
npm start
```

---

### **7. Acessar o Sistema**

Abra seu navegador e acesse:

**URL:** `http://localhost:3000`

**Credenciais padrão:**
- **Usuário:** `admin`
- **Senha:** `admin123`
- **Email:** `admin@sistema.local`

---

## ✅ Verificação

### **Testar se está funcionando:**

1. **Acesse:** http://localhost:3000
2. **Faça login** com as credenciais acima
3. **Verifique** se o dashboard carrega
4. **Teste criar um ticket**

### **Testar API diretamente:**

```bash
# Login
curl -X POST http://localhost:3000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Deve retornar um token JWT
```

---

## 🔧 Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor com nodemon (auto-reload) |
| `npm start` | Inicia servidor em modo produção |
| `npm run setup-db` | Configura banco de dados e cria admin |
| `npm run sync-db` | Sincroniza modelos com banco (cria tabelas) |
| `npm run fix-admin` | Corrige/cria usuário admin |

---

## 🐛 Solução de Problemas Comuns

### **1. Erro: "Cannot find module"**

**Solução:**
```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

---

### **2. Erro: "connection refused" (PostgreSQL)**

**Causa:** PostgreSQL não está rodando ou credenciais incorretas.

**Solução:**
```bash
# Verificar se PostgreSQL está rodando
# Windows:
net start postgresql-x64-14

# Linux:
sudo systemctl start postgresql

# Verificar credenciais no .env
# Testar conexão:
psql -U postgres -h localhost
```

---

### **3. Erro: "database does not exist"**

**Solução:**
```bash
# Criar banco manualmente
psql -U postgres
CREATE DATABASE sistema_tickets_dev;
\q

# OU executar setup
npm run setup-db
```

---

### **4. Erro: "SECRET_KEY is required"**

**Solução:**
```bash
# Gerar chave secreta
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Adicionar no .env
SECRET_KEY=<chave_gerada>
```

---

### **5. Erro: "Port 3000 is already in use"**

**Solução:**
```bash
# Opção 1: Mudar porta no .env
PORT=3001

# Opção 2: Encontrar e matar processo na porta 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:3000 | xargs kill
```

---

### **6. Erro: "Table doesn't exist"**

**Solução:**
```bash
# Sincronizar banco novamente
npm run sync-db
```

---

### **7. Erro: "Cannot login with admin/admin123"**

**Solução:**
```bash
# Recriar usuário admin
npm run fix-admin

# OU criar manualmente via script
node scripts/fix-admin-user.js
```

---

## 📁 Estrutura de Diretórios

```
sistema-tickets/
├── config/              # Configurações
│   └── database.js      # Config do banco
├── middleware/          # Middlewares (auth, etc.)
├── models/              # Modelos Sequelize
├── public/              # Frontend (HTML, CSS, JS)
├── routes/              # Rotas da API
├── scripts/             # Scripts de setup
├── services/            # Serviços (email, SLA, etc.)
├── .env                 # Variáveis de ambiente (criar)
├── .env.example         # Exemplo de .env
├── server.js            # Arquivo principal
└── package.json         # Dependências
```

---

## 🔄 Fluxo de Desenvolvimento

### **1. Fazer alterações no código**
- Edite os arquivos necessários
- Nodemon reinicia automaticamente

### **2. Testar alterações**
- Acesse http://localhost:3000
- Teste as funcionalidades

### **3. Verificar logs**
- Logs aparecem no console
- Erros são exibidos em vermelho

### **4. Sincronizar banco (se necessário)**
```bash
# Se adicionar novos modelos
npm run sync-db
```

---

## 📊 Banco de Dados

### **Tabelas Criadas:**
- `users` - Usuários do sistema
- `tickets` - Tickets (com soft delete)
- `setors` - Setores
- `slas` - Configurações de SLA
- `feriados` - Feriados
- `assuntos` - Assuntos de tickets
- `historico_tickets` - Histórico de alterações
- `anotacoes` - Anotações em tickets
- `user_setors` - Relação usuário-setor

### **Verificar Tabelas:**
```bash
psql -U postgres -d sistema_tickets_dev
\dt  # Listar tabelas
\q   # Sair
```

---

## 🎯 Próximos Passos

Após inicializar:

1. ✅ **Explorar o sistema:**
   - Criar tickets
   - Gerenciar usuários
   - Configurar setores
   - Testar exclusão de tickets

2. ✅ **Configurar email (opcional):**
   - Obter API key do Resend
   - Adicionar no .env
   - Testar notificações

3. ✅ **Adicionar dados de teste:**
   ```bash
   node scripts/add-sample-data-dashboard.js
   node scripts/add-default-holidays.js
   ```

---

## 📝 Notas Importantes

### **Desenvolvimento:**
- ✅ Nodemon reinicia automaticamente
- ✅ Logs detalhados no console
- ✅ CORS configurado para localhost
- ✅ Rate limiting desabilitado (pode reativar)

### **Segurança:**
- ⚠️ `SECRET_KEY` no .env é para desenvolvimento
- ⚠️ Use chave forte em produção
- ⚠️ Não commite o arquivo `.env`

### **Banco de Dados:**
- ✅ Soft delete implementado em Tickets
- ✅ Histórico preservado
- ✅ Relacionamentos mantidos

---

## 🆘 Ajuda Adicional

### **Comandos Úteis:**

```bash
# Ver logs em tempo real
tail -f logs/app.log

# Limpar node_modules e reinstalar
rm -rf node_modules && npm install

# Verificar versões
node --version
npm --version
psql --version

# Testar conexão com banco
psql -U postgres -d sistema_tickets_dev -c "SELECT version();"
```

---

## ✅ Checklist de Inicialização

- [ ] Node.js instalado (v16+)
- [ ] PostgreSQL instalado e rodando
- [ ] Dependências instaladas (`npm install`)
- [ ] Arquivo `.env` criado e configurado
- [ ] Banco de dados criado
- [ ] Scripts de setup executados
- [ ] Servidor iniciado (`npm run dev`)
- [ ] Login funcionando (admin/admin123)
- [ ] Dashboard carregando

---

**🎉 Pronto! Seu ambiente de desenvolvimento está configurado!**

**Dúvidas?** Consulte a documentação ou verifique os logs de erro.

---

**Data:** Janeiro 2025  
**Versão:** 1.0.0

