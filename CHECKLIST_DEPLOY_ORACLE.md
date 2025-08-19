# ✅ Checklist de Deploy - Oracle Cloud Free Tier

## 📋 Dados Necessários para Deploy

### 🔑 Informações da Conta Oracle Cloud
- [ ] **Conta Oracle Cloud Free Tier** criada
- [ ] **Método de pagamento** configurado (cartão de crédito)
- [ ] **Região** selecionada (recomendado: São Paulo)
- [ ] **Limite de recursos** verificado

### 🌐 Informações de Rede
- [ ] **IP Público da VM da Aplicação**: `_________________`
- [ ] **IP Privado da VM do Banco**: `_________________`
- [ ] **Domínio** (opcional): `_________________`
- [ ] **Chave SSH pública** gerada

### 🔐 Informações de Segurança
- [ ] **SECRET_KEY** gerada: `_________________`
- [ ] **Senha do PostgreSQL**: `_________________`
- [ ] **Senha do usuário admin**: `_________________`

## 🚀 Passo a Passo do Deploy

### Fase 1: Preparação Local ✅
- [x] **Dockerfile** criado
- [x] **docker-compose.yml** criado
- [x] **env.production** criado
- [x] **Scripts de deploy** criados
- [x] **Configuração Nginx** criada
- [x] **Configuração PM2** criada

### Fase 2: Oracle Cloud Infrastructure
- [ ] **VCN** criada (`sistema-tickets-vcn`)
- [ ] **Subnet Pública** criada (`10.0.1.0/24`)
- [ ] **Subnet Privada** criada (`10.0.2.0/24`)
- [ ] **Security Lists** configuradas
- [ ] **VM da Aplicação** criada
- [ ] **VM do Banco** criada

### Fase 3: Configuração do Banco
- [ ] **PostgreSQL** instalado na VM do banco
- [ ] **Banco de dados** criado (`sistema_tickets`)
- [ ] **Usuário** criado (`postgres`)
- [ ] **Acesso remoto** configurado
- [ ] **Conexão** testada

### Fase 4: Configuração da Aplicação
- [ ] **Dependências** instaladas na VM da aplicação
- [ ] **Arquivos do projeto** enviados
- [ ] **Variáveis de ambiente** configuradas
- [ ] **Deploy** executado
- [ ] **Aplicação** testada

### Fase 5: Configurações de Produção
- [ ] **Nginx** configurado como reverse proxy
- [ ] **Firewall** configurado (UFW)
- [ ] **SSL/HTTPS** configurado (opcional)
- [ ] **Monitoramento** configurado
- [ ] **Backup** configurado

## 📝 Comandos de Deploy

### 1. Preparação Local
```bash
# Gerar chave SSH
ssh-keygen -t rsa -b 2048 -f ~/.ssh/oracle-cloud-key

# Preparar arquivos
cp env.production .env
node scripts/generate-secret-key.js
```

### 2. Configuração Oracle Cloud
```bash
# Conectar na VM da aplicação
ssh -i ~/.ssh/oracle-cloud-key ubuntu@IP_PUBLICO_APP

# Executar script de configuração
sudo bash scripts/setup-oracle-cloud.sh
```

### 3. Deploy da Aplicação
```bash
# Fazer upload dos arquivos
scp -r . ubuntu@IP_PUBLICO_APP:/home/ubuntu/sistema-tickets/

# Conectar e fazer deploy
ssh -i ~/.ssh/oracle-cloud-key ubuntu@IP_PUBLICO_APP
cd sistema-tickets
bash scripts/deploy-oracle.sh
```

## 🔧 Configurações Específicas

### Variáveis de Ambiente (.env)
```bash
NODE_ENV=production
PORT=3000
SECRET_KEY=SUA_CHAVE_SECRETA_FORTE
DB_HOST=IP_PRIVADO_DB
DB_USER=postgres
DB_PASSWORD=SUA_SENHA_FORTE
DB_NAME=sistema_tickets
DB_PORT=5432
ALLOWED_ORIGINS=https://seu-dominio.com,http://IP_PUBLICO_APP
```

### Security Lists Oracle Cloud
```
Ingress Rules Pública:
- Source: 0.0.0.0/0, Port: 22 (SSH)
- Source: 0.0.0.0/0, Port: 80 (HTTP)
- Source: 0.0.0.0/0, Port: 443 (HTTPS)
- Source: 0.0.0.0/0, Port: 3000 (App)

Ingress Rules Privada:
- Source: 10.0.1.0/24, Port: 5432 (PostgreSQL)
```

## 📊 Monitoramento e Manutenção

### Comandos Úteis
```bash
# Verificar status dos serviços
systemctl status nginx
docker-compose ps
pm2 status

# Ver logs
tail -f /home/ubuntu/sistema-tickets/logs/app.log
docker-compose logs -f

# Monitoramento
./monitor.sh
htop
df -h

# Backup
docker-compose exec postgres pg_dump -U postgres sistema_tickets > backup.sql
```

### Atualizações
```bash
# Atualizar aplicação
git pull origin main
docker-compose down
docker-compose up -d --build

# Atualizar sistema
sudo apt update && sudo apt upgrade -y
```

## 🚨 Troubleshooting

### Problemas Comuns
1. **Aplicação não inicia**: Verificar logs e variáveis de ambiente
2. **Banco não conecta**: Verificar IP e configurações do PostgreSQL
3. **Porta 3000 não acessível**: Verificar firewall e Nginx
4. **SSL não funciona**: Verificar certificado e configuração Nginx

### Logs Importantes
- `/home/ubuntu/sistema-tickets/logs/app.log`
- `/var/log/nginx/sistema-tickets-error.log`
- `docker-compose logs app`
- `docker-compose logs postgres`

## 📞 Suporte

### Contatos
- **Oracle Cloud Support**: Console → Support
- **Documentação**: https://docs.oracle.com/en-us/iaas/
- **Comunidade**: https://community.oracle.com/

### Arquivos de Documentação
- `deploy-oracle-cloud.md` - Guia completo
- `RELATORIO_SEGURANCA.md` - Relatório de segurança
- `GUIA_SEGURANCA.md` - Guia de configuração
- `CORRECOES_IMPLEMENTADAS.md` - Correções técnicas

---

**Status**: 📋 CHECKLIST PRONTO
**Próximo Passo**: Aguardando dados para iniciar deploy
