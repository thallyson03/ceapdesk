#!/bin/bash

# Script de Deploy para Oracle Cloud Free Tier
# Sistema de Tickets

set -e

echo "🚀 Iniciando deploy no Oracle Cloud Free Tier..."
echo "=================================================="

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

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    log_error "Execute este script no diretório raiz do projeto"
    exit 1
fi

# Verificar se .env existe
if [ ! -f ".env" ]; then
    log_warning "Arquivo .env não encontrado. Copiando env.production..."
    if [ -f "env.production" ]; then
        cp env.production .env
        log_info "Arquivo .env criado. Edite-o com suas configurações antes de continuar."
        echo ""
        echo "Configurações necessárias no .env:"
        echo "- SECRET_KEY: Chave secreta forte"
        echo "- DB_HOST: IP da VM do banco de dados"
        echo "- DB_PASSWORD: Senha do PostgreSQL"
        echo "- ALLOWED_ORIGINS: URLs permitidas"
        echo ""
        echo "Execute novamente após configurar o .env"
        exit 1
    else
        log_error "Arquivo env.production não encontrado"
        exit 1
    fi
fi

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    log_error "Docker não está instalado. Instale o Docker primeiro."
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose não está instalado. Instale o Docker Compose primeiro."
    exit 1
fi

log_info "Verificando configurações..."

# Verificar variáveis de ambiente essenciais
source .env

if [ -z "$SECRET_KEY" ] || [ "$SECRET_KEY" = "ALTERE_PARA_UMA_CHAVE_SECRETA_FORTE_AQUI" ]; then
    log_error "SECRET_KEY não configurada no .env"
    exit 1
fi

if [ -z "$DB_HOST" ] || [ "$DB_HOST" = "SEU_IP_PUBLICO_AQUI" ]; then
    log_error "DB_HOST não configurado no .env"
    exit 1
fi

if [ -z "$DB_PASSWORD" ] || [ "$DB_PASSWORD" = "ALTERE_PARA_SENHA_FORTE" ]; then
    log_error "DB_PASSWORD não configurada no .env"
    exit 1
fi

log_success "Configurações básicas verificadas"

# Criar diretório de logs se não existir
if [ ! -d "logs" ]; then
    log_info "Criando diretório de logs..."
    mkdir -p logs
fi

# Gerar chave secreta se necessário
if [ "$SECRET_KEY" = "sua_chave_secreta_muito_segura_aqui_2024" ]; then
    log_info "Gerando nova chave secreta..."
    NEW_SECRET_KEY=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    sed -i "s/SECRET_KEY=.*/SECRET_KEY=$NEW_SECRET_KEY/" .env
    log_success "Nova chave secreta gerada"
fi

# Parar containers existentes
log_info "Parando containers existentes..."
docker-compose down 2>/dev/null || true

# Remover imagens antigas
log_info "Removendo imagens antigas..."
docker-compose down --rmi all 2>/dev/null || true

# Fazer build das imagens
log_info "Fazendo build das imagens Docker..."
docker-compose build --no-cache

# Iniciar serviços
log_info "Iniciando serviços..."
docker-compose up -d

# Aguardar serviços iniciarem
log_info "Aguardando serviços iniciarem..."
sleep 10

# Verificar status dos containers
log_info "Verificando status dos containers..."
docker-compose ps

# Verificar logs
log_info "Verificando logs dos serviços..."
echo ""
echo "=== Logs da Aplicação ==="
docker-compose logs app --tail=20

echo ""
echo "=== Logs do Banco de Dados ==="
docker-compose logs postgres --tail=10

# Verificar se a aplicação está respondendo
log_info "Testando conectividade da aplicação..."
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    log_success "Aplicação está respondendo na porta 3000"
else
    log_warning "Aplicação não está respondendo. Verifique os logs:"
    docker-compose logs app
fi

# Verificar conectividade com o banco
log_info "Testando conectividade com o banco de dados..."
if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
    log_success "Banco de dados está acessível"
else
    log_warning "Banco de dados não está acessível. Verifique os logs:"
    docker-compose logs postgres
fi

echo ""
echo "=================================================="
log_success "Deploy concluído!"
echo ""
echo "📋 Informações importantes:"
echo "- Aplicação: http://localhost:3000"
echo "- Logs: docker-compose logs -f"
echo "- Status: docker-compose ps"
echo "- Parar: docker-compose down"
echo ""
echo "🔧 Para produção no Oracle Cloud:"
echo "1. Configure o firewall (UFW)"
echo "2. Configure Nginx como reverse proxy"
echo "3. Configure SSL/HTTPS"
echo "4. Configure monitoramento"
echo ""
echo "📚 Documentação completa: deploy-oracle-cloud.md"
