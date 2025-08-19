#!/usr/bin/env node

const crypto = require('crypto');

console.log('🔐 Gerando chave secreta forte...\n');

// Gerar chave secreta de 64 bytes (512 bits)
const secretKey = crypto.randomBytes(64).toString('hex');

console.log('✅ Chave secreta gerada com sucesso!\n');
console.log('📋 Adicione esta linha ao seu arquivo .env:');
console.log(`SECRET_KEY=${secretKey}\n`);
console.log('⚠️  IMPORTANTE:');
console.log('   - Mantenha esta chave em segurança');
console.log('   - Nunca compartilhe ou commite no repositório');
console.log('   - Use chaves diferentes para desenvolvimento e produção');
console.log('   - Em produção, use variáveis de ambiente do servidor\n');

// Verificar se o arquivo .env existe
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
    console.log('📝 Arquivo .env encontrado!');
    console.log('💡 Você pode atualizar automaticamente executando:');
    console.log(`   echo "SECRET_KEY=${secretKey}" >> .env`);
} else {
    console.log('📝 Arquivo .env não encontrado.');
    console.log('💡 Crie o arquivo .env baseado no env.example');
}
