# 🚀 Guia de Deploy no Oracle Cloud Free Tier

## 📋 Pré-requisitos

### 1. Conta Oracle Cloud
- [ ] Criar conta no Oracle Cloud Free Tier
- [ ] Verificar limite de recursos gratuitos
- [ ] Configurar método de pagamento (cartão de crédito)

### 2. Recursos Necessários
- **2 Instâncias VM**: 1 para aplicação, 1 para banco de dados
- **2 Block Volumes**: Para armazenamento persistente
- **1 Load Balancer**: Para distribuir tráfego (opcional)
- **1 VCN**: Rede virtual privada

## 🏗️ Arquitetura Proposta

```
Internet → Load Balancer → VM App (Node.js) → VM Database (PostgreSQL)
```

## 📝 Passo a Passo do Deploy

### Fase 1: Preparação Local

#### 1.1 Gerar Chave SSH
```bash
# Gerar par de chaves SSH
ssh-keygen -t rsa -b 2048 -f ~/.ssh/oracle-cloud-key

# Verificar chave pública
cat ~/.ssh/oracle-cloud-key.pub
```

#### 1.2 Preparar Arquivos
```bash
# Copiar arquivo de ambiente
cp env.production .env

# Gerar chave secreta
node scripts/generate-secret-key.js

# Editar .env com as configurações corretas
nano .env
```

### Fase 2: Oracle Cloud Infrastructure

#### 2.1 Criar VCN (Virtual Cloud Network)
1. Acessar Oracle Cloud Console
2. Navegar para Networking → Virtual Cloud Networks
3. Criar VCN com as seguintes configurações:
   - **Nome**: `sistema-tickets-vcn`
   - **CIDR Block**: `10.0.0.0/16`
   - **DNS Resolution**: Habilitado
   - **DNS Hostnames**: Habilitado

#### 2.2 Criar Subnets
1. **Subnet Pública** (para aplicação):
   - **Nome**: `public-subnet`
   - **CIDR**: `10.0.1.0/24`
   - **Route Table**: Default
   - **Security List**: Default

2. **Subnet Privada** (para banco de dados):
   - **Nome**: `private-subnet`
   - **CIDR**: `10.0.2.0/24`
   - **Route Table**: Private
   - **Security List**: Private

#### 2.3 Configurar Security Lists

**Security List Pública**:
```
Ingress Rules:
- Source: 0.0.0.0/0, Port: 22 (SSH)
- Source: 0.0.0.0/0, Port: 80 (HTTP)
- Source: 0.0.0.0/0, Port: 443 (HTTPS)
- Source: 0.0.0.0/0, Port: 3000 (App)

Egress Rules:
- Destination: 0.0.0.0/0, Port: All
```

**Security List Privada**:
```
Ingress Rules:
- Source: 10.0.1.0/24, Port: 5432 (PostgreSQL)

Egress Rules:
- Destination: 0.0.0.0/0, Port: All
```

### Fase 3: Criar Instâncias

#### 3.1 Instância da Aplicação
1. **Compute** → **Instances** → **Create Instance**
2. **Configurações**:
   - **Name**: `sistema-tickets-app`
   - **Image**: Canonical Ubuntu 22.04
   - **Shape**: VM.Standard.A1.Flex (1 OCPU, 6 GB RAM)
   - **Network**: VCN criada anteriormente
   - **Subnet**: Subnet pública
   - **Public IP**: Sim
   - **SSH Key**: Upload da chave pública

#### 3.2 Instância do Banco de Dados
1. **Compute** → **Instances** → **Create Instance**
2. **Configurações**:
   - **Name**: `sistema-tickets-db`
   - **Image**: Canonical Ubuntu 22.04
   - **Shape**: VM.Standard.A1.Flex (1 OCPU, 6 GB RAM)
   - **Network**: VCN criada anteriormente
   - **Subnet**: Subnet privada
   - **Public IP**: Não
   - **SSH Key**: Upload da chave pública

### Fase 4: Configurar Banco de Dados

#### 4.1 Conectar na VM do Banco
```bash
ssh -i ~/.ssh/oracle-cloud-key ubuntu@IP_PRIVADO_DB
```

#### 4.2 Instalar PostgreSQL
```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Iniciar e habilitar serviço
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### 4.3 Configurar PostgreSQL
```bash
# Acessar usuário postgres
sudo -u postgres psql

# Criar banco e usuário
CREATE DATABASE sistema_tickets;
CREATE USER postgres WITH PASSWORD 'SUA_SENHA_FORTE_AQUI';
GRANT ALL PRIVILEGES ON DATABASE sistema_tickets TO postgres;
ALTER USER postgres CREATEDB;
\q

# Configurar acesso remoto
sudo nano /etc/postgresql/*/main/postgresql.conf
# Descomentar e alterar: listen_addresses = '*'

sudo nano /etc/postgresql/*/main/pg_hba.conf
# Adicionar: host all all 10.0.1.0/24 md5

# Reiniciar PostgreSQL
sudo systemctl restart postgresql
```

### Fase 5: Configurar Aplicação

#### 5.1 Conectar na VM da Aplicação
```bash
ssh -i ~/.ssh/oracle-cloud-key ubuntu@IP_PUBLICO_APP
```

#### 5.2 Instalar Dependências
```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Reiniciar sessão SSH
exit
ssh -i ~/.ssh/oracle-cloud-key ubuntu@IP_PUBLICO_APP
```

#### 5.3 Deploy da Aplicação
```bash
# Clonar repositório (se usar Git)
git clone SEU_REPOSITORIO_AQUI
cd sistema-tickets

# Ou fazer upload dos arquivos via SCP
# (fazer upload dos arquivos do projeto)

# Configurar variáveis de ambiente
cp env.production .env
nano .env  # Editar com IPs corretos

# Fazer deploy com Docker Compose
docker-compose up -d

# Verificar logs
docker-compose logs -f
```

### Fase 6: Configurar Load Balancer (Opcional)

#### 6.1 Criar Load Balancer
1. **Networking** → **Load Balancers** → **Create Load Balancer**
2. **Configurações**:
   - **Name**: `sistema-tickets-lb`
   - **Shape**: Flexible
   - **Bandwidth**: 10 Mbps
   - **VCN**: VCN criada
   - **Subnet**: Subnet pública

#### 6.2 Configurar Backend Set
1. **Backend Sets** → **Create Backend Set**
2. **Configurações**:
   - **Name**: `app-backend`
   - **Policy**: ROUND_ROBIN
   - **Health Check**: HTTP, Port 3000, Path `/`

#### 6.3 Configurar Listener
1. **Listeners** → **Create Listener**
2. **Configurações**:
   - **Name**: `http-listener`
   - **Protocol**: HTTP
   - **Port**: 80
   - **Backend Set**: app-backend

### Fase 7: Configurar Domínio (Opcional)

#### 7.1 DNS
1. Configurar registros A no seu provedor de DNS
2. Apontar para IP do Load Balancer ou VM da aplicação

#### 7.2 SSL/HTTPS
```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obter certificado SSL
sudo certbot --nginx -d seu-dominio.com
```

## 🔧 Configurações de Produção

### 1. Variáveis de Ambiente (.env)
```bash
NODE_ENV=production
PORT=3000
SECRET_KEY=SUA_CHAVE_SECRETA_FORTE
DB_HOST=IP_PRIVADO_DB
DB_USER=postgres
DB_PASSWORD=SUA_SENHA_FORTE
DB_NAME=sistema_tickets
DB_PORT=5432
ALLOWED_ORIGINS=https://seu-dominio.com
```

### 2. PM2 (Process Manager)
```bash
# Instalar PM2
npm install -g pm2

# Criar arquivo ecosystem.config.js
pm2 ecosystem

# Iniciar aplicação
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 3. Nginx (Reverse Proxy)
```bash
# Instalar Nginx
sudo apt install nginx -y

# Configurar site
sudo nano /etc/nginx/sites-available/sistema-tickets

# Conteúdo:
server {
    listen 80;
    server_name seu-dominio.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Habilitar site
sudo ln -s /etc/nginx/sites-available/sistema-tickets /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 📊 Monitoramento

### 1. Logs
```bash
# Ver logs da aplicação
docker-compose logs -f app

# Ver logs do banco
docker-compose logs -f postgres

# Logs do sistema
sudo journalctl -u docker.service -f
```

### 2. Métricas
```bash
# Uso de CPU e memória
htop

# Uso de disco
df -h

# Uso de rede
iftop
```

## 🔒 Segurança

### 1. Firewall
```bash
# Configurar UFW
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 2. Atualizações Automáticas
```bash
# Configurar atualizações automáticas
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

## 🚨 Troubleshooting

### Problemas Comuns

1. **Aplicação não inicia**:
   ```bash
   docker-compose logs app
   docker-compose down && docker-compose up -d
   ```

2. **Banco não conecta**:
   ```bash
   # Verificar se PostgreSQL está rodando
   sudo systemctl status postgresql
   
   # Testar conexão
   psql -h IP_DB -U postgres -d sistema_tickets
   ```

3. **Porta 3000 não acessível**:
   ```bash
   # Verificar se aplicação está rodando
   netstat -tlnp | grep 3000
   
   # Verificar firewall
   sudo ufw status
   ```

## 📞 Suporte

### Contatos Úteis
- **Oracle Cloud Support**: Console → Support
- **Documentação**: https://docs.oracle.com/en-us/iaas/
- **Comunidade**: https://community.oracle.com/

---

**Status**: 📋 GUIA CRIADO
**Próximo Passo**: Aguardando dados para configuração específica
