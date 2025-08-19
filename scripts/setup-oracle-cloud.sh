#!/bin/bash

# Script de Configuração para Oracle Cloud Free Tier
# Sistema de Tickets

set -e

echo "🔧 Configurando Oracle Cloud Free Tier..."
echo "=========================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se é root
if [ "$EUID" -ne 0 ]; then
    log_error "Execute este script como root (sudo)"
    exit 1
fi

# Atualizar sistema
log_info "Atualizando sistema..."
apt update && apt upgrade -y

# Instalar dependências básicas
log_info "Instalando dependências básicas..."
apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Instalar Node.js
log_info "Instalando Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Verificar versão do Node.js
NODE_VERSION=$(node --version)
log_success "Node.js instalado: $NODE_VERSION"

# Instalar Docker
log_info "Instalando Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker ubuntu

# Instalar Docker Compose
log_info "Instalando Docker Compose..."
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Verificar versão do Docker
DOCKER_VERSION=$(docker --version)
log_success "Docker instalado: $DOCKER_VERSION"

# Instalar Nginx
log_info "Instalando Nginx..."
apt install -y nginx

# Configurar Nginx
log_info "Configurando Nginx..."
cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup

# Criar configuração do sistema
cat > /etc/nginx/sites-available/sistema-tickets << 'EOF'
server {
    listen 80;
    server_name _;
    
    access_log /var/log/nginx/sistema-tickets-access.log;
    error_log /var/log/nginx/sistema-tickets-error.log;
    
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
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Habilitar site
ln -sf /etc/nginx/sites-available/sistema-tickets /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Testar configuração do Nginx
nginx -t

# Instalar PM2
log_info "Instalando PM2..."
npm install -g pm2

# Configurar firewall
log_info "Configurando firewall..."
ufw allow ssh
ufw allow 80
ufw allow 443
ufw allow 3000
ufw --force enable

# Configurar atualizações automáticas
log_info "Configurando atualizações automáticas..."
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades

# Criar diretório para logs
log_info "Criando diretórios..."
mkdir -p /var/log/sistema-tickets
mkdir -p /home/ubuntu/sistema-tickets/logs

# Configurar permissões
chown -R ubuntu:ubuntu /home/ubuntu/sistema-tickets
chmod -R 755 /home/ubuntu/sistema-tickets

# Configurar logrotate
cat > /etc/logrotate.d/sistema-tickets << 'EOF'
/home/ubuntu/sistema-tickets/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 ubuntu ubuntu
    postrotate
        systemctl reload nginx
    endscript
}
EOF

# Configurar monitoramento básico
log_info "Configurando monitoramento..."
apt install -y htop iotop iftop

# Criar script de monitoramento
cat > /home/ubuntu/monitor.sh << 'EOF'
#!/bin/bash
echo "=== Sistema de Tickets - Monitoramento ==="
echo "Data: $(date)"
echo ""
echo "=== Uso de CPU e Memória ==="
free -h
echo ""
echo "=== Uso de Disco ==="
df -h
echo ""
echo "=== Status dos Serviços ==="
systemctl status nginx --no-pager -l
echo ""
echo "=== Status dos Containers ==="
docker ps
echo ""
echo "=== Logs Recentes ==="
tail -20 /home/ubuntu/sistema-tickets/logs/app.log
EOF

chmod +x /home/ubuntu/monitor.sh

# Configurar cron para monitoramento
echo "0 */6 * * * /home/ubuntu/monitor.sh >> /home/ubuntu/sistema-tickets/logs/monitor.log 2>&1" | crontab -

# Reiniciar serviços
log_info "Reiniciando serviços..."
systemctl restart nginx
systemctl enable nginx

# Verificar status dos serviços
log_info "Verificando status dos serviços..."
systemctl status nginx --no-pager -l

echo ""
echo "=========================================="
log_success "Configuração do Oracle Cloud concluída!"
echo ""
echo "📋 Próximos passos:"
echo "1. Fazer upload dos arquivos do projeto"
echo "2. Configurar variáveis de ambiente (.env)"
echo "3. Executar deploy: ./scripts/deploy-oracle.sh"
echo "4. Configurar domínio e SSL (opcional)"
echo ""
echo "🔧 Comandos úteis:"
echo "- Monitoramento: ./monitor.sh"
echo "- Logs: tail -f /home/ubuntu/sistema-tickets/logs/app.log"
echo "- Status: systemctl status nginx"
echo "- Reiniciar: systemctl restart nginx"
echo ""
echo "🌐 Aplicação estará disponível em:"
echo "- http://SEU_IP_PUBLICO"
echo "- http://SEU_DOMINIO (após configurar DNS)"
