# 🔧 Correção de Erros: 500 Internal Server Error e CSP

## 📋 Análise dos Erros

### **1. Erro 500 - Internal Server Error**
```
api/v1/tickets:1 Failed to load resource: the server responded with a status of 500
```

**Causa:**
- O modelo `Ticket` foi configurado com `paranoid: true` (soft delete)
- O Sequelize espera que a coluna `deletedAt` exista no banco de dados
- A coluna não foi criada quando o banco foi sincronizado
- Ao fazer queries, o Sequelize tenta usar `WHERE deletedAt IS NULL`, mas a coluna não existe

**Sintoma:**
- Erro 500 ao acessar `/api/v1/tickets`
- Erro no console do servidor sobre coluna não encontrada

---

### **2. Avisos de Content Security Policy (CSP)**
```
Connecting to 'https://cdn.jsdelivr.net/...' violates the following Content Security Policy directive: "default-src 'self'"
```

**Causa:**
- O Helmet está configurado com CSP
- A diretiva `connectSrc` não foi definida
- O navegador tenta carregar source maps do CDN, mas o CSP bloqueia

**Impacto:**
- ⚠️ Apenas avisos no console (não crítico)
- Source maps não carregam (debugging mais difícil)
- Sistema funciona normalmente

---

## ✅ Soluções Implementadas

### **1. Script para Adicionar Coluna deletedAt**

Criei o script `scripts/add-deletedAt-column.js` que:
- Conecta ao banco de dados
- Verifica se a coluna já existe
- Adiciona a coluna `deletedAt` se não existir
- Não afeta dados existentes

**Como usar:**
```bash
npm run add-deletedAt
```

**OU manualmente:**
```bash
node scripts/add-deletedAt-column.js
```

---

### **2. Correção do Content Security Policy**

Adicionei a diretiva `connectSrc` no Helmet para permitir conexões com CDNs:

```javascript
connectSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"]
```

Isso permite:
- Carregar source maps do CDN
- Elimina avisos no console
- Melhora experiência de debugging

---

### **3. Melhorias no Tratamento de Erros**

Adicionei logs mais detalhados na rota de tickets:
- Mensagem de erro mais clara
- Stack trace em desenvolvimento
- Facilita identificação de problemas futuros

---

## 🚀 Como Aplicar as Correções

### **Passo 1: Adicionar Coluna deletedAt**

```bash
# Execute o script
npm run add-deletedAt
```

**Saída esperada:**
```
🔌 Conectando ao banco de dados...
✅ Conexão estabelecida com sucesso.
📝 Adicionando coluna deletedAt...
✅ Coluna deletedAt adicionada com sucesso!
✅ Soft delete agora está funcionando corretamente.
🔌 Conexão fechada.
```

---

### **Passo 2: Reiniciar o Servidor**

```bash
# Parar o servidor (Ctrl+C)
# Reiniciar
npm run dev
```

---

### **Passo 3: Testar**

1. Acesse `http://localhost:3000`
2. Faça login
3. Tente criar/listar tickets
4. Verifique se não há mais erro 500

---

## 🔍 Verificação

### **Verificar se a coluna foi criada:**

```bash
# Conectar ao PostgreSQL
psql -U postgres -d sistema_tickets_dev

# Verificar colunas da tabela Tickets
\d "Tickets"

# OU via SQL
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Tickets' 
AND column_name = 'deletedAt';

# Sair
\q
```

---

## 📊 Estrutura da Coluna

A coluna `deletedAt` será criada como:
- **Tipo:** `TIMESTAMP`
- **Nullable:** `TRUE` (permite NULL)
- **Default:** `NULL`
- **Uso:** Quando um ticket é deletado (soft delete), recebe a data/hora. Quando NULL, o ticket está ativo.

---

## ⚠️ Se o Erro Persistir

### **1. Verificar Logs do Servidor**

Olhe o console onde o servidor está rodando. Você deve ver:
```
Erro ao buscar tickets: [mensagem de erro]
Detalhes do erro: [detalhes]
Stack: [stack trace]
```

### **2. Verificar Conexão com Banco**

```bash
# Testar conexão
psql -U postgres -d sistema_tickets_dev -c "SELECT 1;"
```

### **3. Verificar Variáveis de Ambiente**

Certifique-se de que o `.env` está configurado corretamente:
```env
DB_USER=postgres
DB_PASSWORD=sua_senha
DB_NAME=sistema_tickets_dev
DB_HOST=localhost
DB_PORT=5432
```

### **4. Sincronizar Banco Novamente**

Se necessário, sincronize o banco novamente:
```bash
npm run sync-db
```

**⚠️ ATENÇÃO:** Isso pode recriar tabelas se usar `force: true`. Use com cuidado em produção.

---

## 🎯 Resultado Esperado

Após aplicar as correções:

✅ **Erro 500 resolvido:**
- API `/api/v1/tickets` funciona normalmente
- Tickets podem ser criados, listados e gerenciados
- Soft delete funciona corretamente

✅ **Avisos CSP resolvidos:**
- Sem avisos no console do navegador
- Source maps carregam corretamente
- Melhor experiência de debugging

---

## 📝 Notas Técnicas

### **Por que a coluna não foi criada automaticamente?**

- O Sequelize com `paranoid: true` **não cria** a coluna automaticamente ao sincronizar
- A coluna precisa ser criada manualmente ou via migração
- O `sync()` do Sequelize cria apenas as colunas definidas explicitamente no modelo

### **Alternativa: Migração com Sequelize CLI**

Se preferir usar migrações formais:
```bash
# Instalar Sequelize CLI
npm install --save-dev sequelize-cli

# Criar migração
npx sequelize-cli migration:generate --name add-deletedAt-to-tickets

# Editar migração e executar
npx sequelize-cli db:migrate
```

---

## ✅ Checklist de Correção

- [ ] Executar `npm run add-deletedAt`
- [ ] Verificar se a coluna foi criada
- [ ] Reiniciar servidor (`npm run dev`)
- [ ] Testar criação de tickets
- [ ] Testar listagem de tickets
- [ ] Verificar se não há mais erro 500
- [ ] Verificar se avisos CSP desapareceram

---

**Data:** Janeiro 2025  
**Status:** ✅ Correções implementadas


