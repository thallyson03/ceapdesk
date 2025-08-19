# Guia de Segurança - Sistema de Tickets

## 🚀 Configuração Inicial de Segurança

### 1. Gerar Chave Secreta Forte

Execute o comando para gerar uma chave secreta forte:

```bash
npm run generate-secret
```

Copie a chave gerada e adicione ao seu arquivo `.env`:

```env
SECRET_KEY=sua_chave_gerada_aqui
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` baseado no `env.example`:

```bash
cp env.example .env
```

Configure as seguintes variáveis obrigatórias:

```env
# 🔐 SEGURANÇA (OBRIGATÓRIO)
SECRET_KEY=sua_chave_secreta_gerada

# 🗄️ BANCO DE DADOS (OBRIGATÓRIO)
DB_USER=seu_usuario
DB_PASSWORD=sua_senha_forte
DB_NAME=sistema_tickets
DB_HOST=localhost
DB_PORT=5432

# 🌐 CORS (RECOMENDADO)
ALLOWED_ORIGINS=http://localhost:3000,https://seudominio.com

# 👤 ADMIN (OPCIONAL)
ADMIN_PASSWORD=senha_admin_temporaria
```

### 3. Instalar Dependências de Segurança

```bash
npm install
```

## 🔒 Melhorias Implementadas

### ✅ Headers de Segurança HTTP
- **Helmet.js** implementado
- Proteção contra XSS, clickjacking, MIME sniffing
- Headers de segurança configurados

### ✅ Rate Limiting
- **Limite global**: 100 requisições por 15 minutos
- **Limite de login**: 5 tentativas por 15 minutos
- Proteção contra ataques de força bruta

### ✅ CORS Configurado
- Origem restrita a domínios específicos
- Métodos HTTP limitados
- Headers permitidos controlados

### ✅ Validação de Entrada
- **Express-validator** implementado
- Validação de dados de entrada
- Sanitização de dados

### ✅ Autenticação Melhorada
- Tokens JWT com expiração configurável
- Validação robusta de tokens
- Logs de tentativas de acesso

### ✅ Política de Senhas
- Comprimento mínimo configurável
- Complexidade opcional (maiúsculas, minúsculas, números, especiais)
- Validação no registro e alteração

### ✅ Logging de Segurança
- Logs de tentativas de login falhadas
- Logs de ações administrativas
- Logs de acessos negados

## 🛡️ Configurações de Produção

### 1. Variáveis de Ambiente de Produção

```env
NODE_ENV=production
SECRET_KEY=chave_super_secreta_producao
ALLOWED_ORIGINS=https://seudominio.com,https://www.seudominio.com
RATE_LIMIT_MAX_REQUESTS=50
JWT_EXPIRES_IN=30m
REQUIRE_PASSWORD_COMPLEXITY=true
MIN_PASSWORD_LENGTH=10
```

### 2. Configuração do Servidor

```bash
# Usar PM2 para produção
npm install -g pm2
pm2 start server.js --name "sistema-tickets"

# Configurar HTTPS
# Instalar certificado SSL
# Configurar proxy reverso (nginx/apache)
```

### 3. Configuração do Banco de Dados

```sql
-- Criar usuário específico para a aplicação
CREATE USER sistema_tickets WITH PASSWORD 'senha_forte_aqui';

-- Dar permissões mínimas necessárias
GRANT CONNECT ON DATABASE sistema_tickets TO sistema_tickets;
GRANT USAGE ON SCHEMA public TO sistema_tickets;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO sistema_tickets;
```

## 🔍 Monitoramento de Segurança

### Logs Importantes

1. **Tentativas de Login Falhadas**
   ```
   🚨 Tentativa de login com usuário inexistente: usuario - IP: 192.168.1.100
   🚨 Tentativa de login com senha incorreta: admin - IP: 192.168.1.100
   ```

2. **Acessos Negados**
   ```
   🚨 Tentativa de acesso admin negada - Usuario: user1 - Role: user - IP: 192.168.1.100
   🚨 Acesso negado ao setor TI - Usuario: user2 - Setores: RH,Financeiro - IP: 192.168.1.100
   ```

3. **Ações Administrativas**
   ```
   ✅ Usuário joao criado por admin admin
   ✅ Setores atualizados para usuário maria por admin admin
   ```

### Alertas Recomendados

Configure alertas para:
- Múltiplas tentativas de login falhadas
- Acessos a recursos não autorizados
- Ações administrativas fora do horário comercial
- Padrões suspeitos de uso

## 🧪 Testes de Segurança

### 1. Teste de Rate Limiting

```bash
# Testar limite de login
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/v1/users/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"wrong"}'
done
```

### 2. Teste de CORS

```bash
# Testar origem não permitida
curl -H "Origin: http://malicious-site.com" \
  http://localhost:3000/api/v1/users
```

### 3. Teste de Validação

```bash
# Testar validação de senha
curl -X POST http://localhost:3000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer seu_token_admin" \
  -d '{"username":"test","password":"123","role":"user"}'
```

## 📋 Checklist de Segurança

### ✅ Configuração Inicial
- [ ] Chave secreta forte gerada
- [ ] Variáveis de ambiente configuradas
- [ ] Dependências de segurança instaladas
- [ ] Banco de dados configurado com usuário específico

### ✅ Configuração de Produção
- [ ] NODE_ENV=production
- [ ] HTTPS configurado
- [ ] Rate limiting ajustado
- [ ] CORS configurado para domínios específicos
- [ ] Logs de segurança ativos

### ✅ Monitoramento
- [ ] Logs de segurança configurados
- [ ] Alertas configurados
- [ ] Backup automático configurado
- [ ] Monitoramento de performance ativo

### ✅ Manutenção
- [ ] Atualizações de dependências regulares
- [ ] Revisão de logs de segurança
- [ ] Testes de segurança periódicos
- [ ] Backup de dados testado

## 🆘 Incidentes de Segurança

### Em Caso de Comprometimento

1. **Isolar o sistema**
   - Desligar o servidor se necessário
   - Bloquear acesso externo

2. **Investigar**
   - Revisar logs de segurança
   - Identificar ponto de entrada
   - Documentar o incidente

3. **Corrigir**
   - Aplicar patches de segurança
   - Alterar senhas e chaves
   - Reforçar configurações

4. **Recuperar**
   - Restaurar de backup limpo
   - Verificar integridade dos dados
   - Monitorar por atividades suspeitas

### Contatos de Emergência

- **Administrador do Sistema**: [seu-email@dominio.com]
- **Suporte Técnico**: [suporte@dominio.com]
- **Segurança**: [seguranca@dominio.com]

---

**Última Atualização**: $(date)
**Versão**: 1.0
**Responsável**: Equipe de Desenvolvimento
