# Migração - Campos de Cliente

## 📋 Resumo das Alterações

Foram adicionados três novos campos ao modelo de Ticket:

- **`cpfCnpj`**: Campo para armazenar CPF ou CNPJ do cliente (formato: 000.000.000-00 ou 00.000.000/0000-00)
- **`nomeCliente`**: Campo para armazenar o nome completo do cliente
- **`numeroContato`**: Campo para armazenar o número de telefone do cliente (formato: (11) 99999-9999)

## 🔧 Arquivos Modificados

### 1. Modelo de Dados
- `models/Ticket.js` - Adicionados os novos campos ao modelo

### 2. API
- `routes/tickets.js` - Atualizada a rota POST para aceitar os novos campos

### 3. Interface Web
- `public/criar-ticket.html` - Adicionados campos no formulário de criação
- `public/ticket-detalhes.html` - Adicionada exibição dos campos na visualização

### 4. Documentação
- `API_DOCS_WEB.html` - Atualizada com exemplos dos novos campos

## 🗄️ Migração do Banco de Dados

### Opção 1: Script Automático
```bash
node scripts/add-client-fields.js
```

### Opção 2: Migração Manual (PostgreSQL)
```sql
-- Adicionar campo CPF/CNPJ
ALTER TABLE "Tickets" ADD COLUMN "cpfCnpj" VARCHAR(18);

-- Adicionar campo Nome do Cliente
ALTER TABLE "Tickets" ADD COLUMN "nomeCliente" VARCHAR(255);

-- Adicionar campo Número de Contato
ALTER TABLE "Tickets" ADD COLUMN "numeroContato" VARCHAR(20);
```

### Opção 3: Migração Manual (Oracle)
```sql
-- Adicionar campo CPF/CNPJ
ALTER TABLE "Tickets" ADD "cpfCnpj" VARCHAR2(18);

-- Adicionar campo Nome do Cliente
ALTER TABLE "Tickets" ADD "nomeCliente" VARCHAR2(255);

-- Adicionar campo Número de Contato
ALTER TABLE "Tickets" ADD "numeroContato" VARCHAR2(20);
```

## 📝 Como Usar

### Via API
```bash
curl -X POST https://seu-servidor.com/api/v1/tickets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "titulo": "Problema com impressora",
    "descricao": "A impressora não está funcionando",
    "cpfCnpj": "123.456.789-00",
    "nomeCliente": "João Silva",
    "numeroContato": "(11) 99999-9999",
    "prioridade": "alta",
    "areaResponsavel": "TI"
  }'
```

### Via Interface Web
1. Acesse a página de criação de tickets
2. Preencha os campos obrigatórios (título e descrição)
3. Opcionalmente, preencha CPF/CNPJ, nome do cliente e número de contato
4. Selecione prioridade e área responsável
5. Clique em "Criar Ticket"

## ✅ Verificação

Após a migração, você pode verificar se os campos foram adicionados:

### PostgreSQL
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Tickets' 
AND column_name IN ('cpfCnpj', 'nomeCliente', 'numeroContato');
```

### Oracle
```sql
SELECT column_name, data_type 
FROM user_tab_columns 
WHERE table_name = 'TICKETS' 
AND column_name IN ('CPFCNPJ', 'NOMECLIENTE', 'NUMEROCONTATO');
```

## 🔄 Compatibilidade

- Os novos campos são **opcionais** - tickets existentes continuarão funcionando
- A API mantém compatibilidade com versões anteriores
- A interface web exibe "Não informado" quando os campos estão vazios

## 🚀 Próximos Passos

1. Execute a migração do banco de dados
2. Reinicie o servidor da aplicação
3. Teste a criação de tickets com os novos campos
4. Verifique se os dados são exibidos corretamente na visualização de tickets

## ❓ Suporte

Se encontrar problemas durante a migração:

1. Verifique as credenciais do banco de dados
2. Confirme se o banco está acessível
3. Execute a migração manual se o script automático falhar
4. Verifique os logs do servidor para erros específicos
