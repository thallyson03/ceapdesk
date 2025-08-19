# Migração do SQLite para PostgreSQL

Este documento contém as instruções para migrar o sistema de tickets do SQLite para PostgreSQL.

## Pré-requisitos

1. **PostgreSQL instalado** no seu sistema
2. **Node.js** e **npm** instalados
3. **Backup** do banco SQLite atual

## Passos para Migração

### 1. Instalar PostgreSQL

#### Windows:
- Baixe e instale o PostgreSQL do site oficial: https://www.postgresql.org/download/windows/
- Durante a instalação, anote a senha do usuário `postgres`
- Mantenha a porta padrão (5432)

#### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### macOS:
```bash
brew install postgresql
brew services start postgresql
```

### 2. Criar o Banco de Dados

1. Abra o terminal/prompt de comando
2. Conecte ao PostgreSQL:
   ```bash
   psql -U postgres
   ```
3. Execute o script SQL:
   ```bash
   \i scripts/create-database.sql
   ```
4. Ou execute manualmente:
   ```sql
   CREATE DATABASE sistema_tickets;
   ```

### 3. Configurar Variáveis de Ambiente

1. Copie o arquivo `env.example` para `.env`:
   ```bash
   cp env.example .env
   ```

2. Edite o arquivo `.env` com suas configurações:
   ```env
   # Configurações do Banco de Dados PostgreSQL
   DB_USER=postgres
   DB_PASSWORD=sua_senha_aqui
   DB_NAME=sistema_tickets
   DB_HOST=localhost
   DB_PORT=5432
   ```

### 4. Verificar Qualidade dos Dados

Antes da migração, verifique a qualidade dos dados no SQLite:

```bash
# Verificar estrutura das tabelas
npm run check-sqlite

# Verificar qualidade dos dados (campos nulos, etc.)
npm run check-data
```

### 5. Executar a Migração

#### Opção 1: Migração Simplificada (Recomendada)
```bash
npm run migrate:simple
```

**Características:**
- ✅ Trata campos nulos automaticamente
- ✅ Usa valores padrão para dados faltantes
- ✅ Continua migração mesmo com alguns erros
- ✅ Relatório detalhado do processo
- ✅ Logs de warnings para dados corrigidos

#### Opção 2: Migração Segura
```bash
npm run migrate:safe
```

#### Opção 3: Migração Original
```bash
npm run migrate
```

### 6. Solução de Problemas de ENUM

Se você encontrar erros relacionados a tipos ENUM durante a migração:

```bash
# Corrigir estrutura do banco PostgreSQL
npm run fix-postgres

# Depois executar migração simplificada
npm run migrate:simple
```

### 7. Verificar a Migração

1. Conecte ao PostgreSQL:
   ```bash
   psql -U postgres -d sistema_tickets
   ```

2. Verifique as tabelas:
   ```sql
   \dt
   ```

3. Verifique os dados:
   ```sql
   SELECT COUNT(*) FROM "Users";
   SELECT COUNT(*) FROM "Tickets";
   SELECT COUNT(*) FROM "Setors";
   ```

### 8. Testar o Sistema

1. Inicie o servidor:
   ```bash
   npm start
   ```

2. Acesse o sistema no navegador
3. Verifique se todas as funcionalidades estão funcionando

## Estrutura de Arquivos Após Migração

```
sistema-tickets/
├── config/
│   └── database.js          # Configurações do PostgreSQL
├── scripts/
│   ├── migrate-to-postgres.js      # Script de migração original
│   ├── migrate-to-postgres-safe.js # Script de migração segura
│   ├── migrate-simple.js           # Script de migração simplificada
│   ├── fix-postgres-enums.js       # Script para corrigir ENUMs
│   ├── create-database.sql         # Script SQL para criar banco
│   ├── backup-sqlite.js            # Script de backup
│   ├── check-sqlite-tables.js      # Verificar estrutura das tabelas
│   ├── check-sqlite-data.js        # Verificar qualidade dos dados
│   └── test-postgres-connection.js # Teste de conexão
├── models/
│   └── index.js              # Configuração do Sequelize para PostgreSQL
├── .env                      # Variáveis de ambiente
├── env.example              # Exemplo de variáveis
└── MIGRACAO_POSTGRESQL.md   # Este arquivo
```

## Comandos Disponíveis

```bash
# Verificar tabelas no SQLite
npm run check-sqlite

# Verificar qualidade dos dados
npm run check-data

# Fazer backup do SQLite
npm run backup

# Testar conexão PostgreSQL
npm run postgres:test

# Corrigir problemas de ENUM
npm run fix-postgres

# Migração simplificada (recomendada)
npm run migrate:simple

# Migração segura
npm run migrate:safe

# Migração original
npm run migrate

# Ver configurações do banco
npm run postgres:config
```

## Tratamento de Dados Nulos

O script de migração simplificada (`migrate-simple.js`) trata automaticamente campos nulos ou vazios:

### Valores Padrão Utilizados:

**Tabela Users:**
- `username`: `usuario_[id]` ou `usuario_[timestamp]`
- `password`: `senha_padrao`
- `role`: `user`
- `setor`: `Geral`

**Tabela Setors:**
- `nome`: `Setor_[id]` ou `Setor_[timestamp]`

**Tabela Tickets:**
- `titulo`: `Título não informado`
- `descricao`: `Descrição não informada`
- `status`: `aberto`
- `prioridade`: `media`
- `setor`: `Geral`
- `solicitante`: `Usuário`

**Tabela Anotacaos:**
- `ticketId`: `1` (valor padrão)
- `conteudo`: `Anotação sem conteúdo`
- `autor`: `Sistema`

**Tabela historicoTickets:**
- `alteracao`: `Alteração não especificada`
- `usuario`: `Sistema`
- `dataAlteracao`: Data atual

**Tabela RegistroDeAlteracaos:**
- `campo`: `campo_nao_especificado`
- `valorAnterior`: `não informado`
- `valorNovo`: `não informado`
- `usuario`: `Sistema`
- `dataAlteracao`: Data atual

### Logs de Migração:

O script mostra warnings quando usa valores padrão:
```
⚠️  Ticket 1: usando valores padrão para campos obrigatórios
⚠️  Anotação 2: usando valores padrão para campos obrigatórios
```

## Solução de Problemas

### Erro de Conexão
- Verifique se o PostgreSQL está rodando
- Confirme as credenciais no arquivo `.env`
- Verifique se a porta está correta

### Erro de Permissão
- Certifique-se de que o usuário tem permissão para criar bancos
- Execute como superusuário se necessário

### Erro de ENUM
- Execute `npm run fix-postgres` para corrigir a estrutura
- Use `npm run migrate:simple` para migração sem ENUMs

### Erro de Migração
- Verifique se o banco SQLite existe e está acessível
- Confirme se todas as dependências estão instaladas
- Use o script de migração simplificada

### Campos Nulos
- Execute `npm run check-data` para identificar problemas
- O script de migração simplificada trata automaticamente
- Valores padrão são aplicados para manter integridade

## Rollback (Voltar ao SQLite)

Se precisar voltar ao SQLite:

1. Restaure o arquivo `models/index.js` original
2. Restaure o arquivo `config.js` original
3. Remova os arquivos de configuração do PostgreSQL
4. Reinicie o servidor

## Vantagens do PostgreSQL

- **Performance**: Melhor para aplicações em produção
- **Escalabilidade**: Suporta mais usuários simultâneos
- **Recursos Avançados**: Índices, transações, triggers
- **Backup e Recuperação**: Ferramentas robustas
- **Concorrência**: Melhor controle de acesso simultâneo

## Fluxo Recomendado

1. **Fazer backup**: `npm run backup`
2. **Verificar SQLite**: `npm run check-sqlite`
3. **Verificar dados**: `npm run check-data`
4. **Testar conexão**: `npm run postgres:test`
5. **Se houver problemas de ENUM**: `npm run fix-postgres`
6. **Executar migração**: `npm run migrate:simple`
7. **Testar sistema**: `npm start`

## Suporte

Em caso de problemas durante a migração, verifique:
1. Logs do PostgreSQL
2. Logs do Node.js
3. Configurações de rede/firewall
4. Permissões de usuário
5. Execute os scripts de correção se necessário
6. Verifique a qualidade dos dados com `npm run check-data`
