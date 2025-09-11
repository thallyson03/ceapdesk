
// config.js
require('dotenv').config();

// Função para gerar chave secreta forte
function generateSecretKey() {
    const crypto = require('crypto');
    return crypto.randomBytes(64).toString('hex');
}

// Validação de variáveis de ambiente obrigatórias
function validateRequiredEnvVars() {
    const required = ['SECRET_KEY'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        console.error('❌ Variáveis de ambiente obrigatórias não encontradas:', missing);
        console.error('💡 Configure as seguintes variáveis no arquivo .env:');
        missing.forEach(key => {
            if (key === 'SECRET_KEY') {
                console.error(`   ${key}=${generateSecretKey()}`);
            } else {
                console.error(`   ${key}=valor_obrigatorio`);
            }
        });
        process.exit(1);
    }
}

// Validar variáveis obrigatórias
validateRequiredEnvVars();

module.exports = {
    SECRET_KEY: process.env.SECRET_KEY,
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    FORCE_HTTPS: process.env.FORCE_HTTPS || 'false',
    
    // Configurações do banco de dados PostgreSQL
    DB_USER: process.env.DB_USER || 'postgres',
    DB_PASSWORD: process.env.DB_PASSWORD || 'postgres',
    DB_NAME: process.env.DB_NAME || 'sistema_tickets_dev',
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: process.env.DB_PORT || 5432,
    
    // Configurações de segurança
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS ? 
        process.env.ALLOWED_ORIGINS.split(',') : 
        (process.env.NODE_ENV === 'production' ? 
            ['http://129.146.176.225.nip.io', 'http://129.146.176.225', 'https://129.146.176.225.nip.io', 'https://centralcrm.ceapebank.com.br'] : 
            ['http://localhost:3000', 'http://127.0.0.1:3000']),
    
    // Configurações de rate limiting
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    
    // Configurações de JWT
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '6mo',
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '1y',
    
    // Configurações de senha
    MIN_PASSWORD_LENGTH: parseInt(process.env.MIN_PASSWORD_LENGTH) || 8,
    REQUIRE_PASSWORD_COMPLEXITY: process.env.REQUIRE_PASSWORD_COMPLEXITY === 'true',
    
    // Configurações de logging
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    LOG_FILE: process.env.LOG_FILE || 'logs/app.log'
};

