#!/usr/bin/env node

// Forçar carregamento do .env primeiro
require('dotenv').config();

const { sequelize } = require('../models');

async function syncDatabase() {
    try {
        console.log('🔄 Iniciando sincronização do banco de dados...');
        console.log('📊 Configurações:');
        console.log(`   Host: ${process.env.DB_HOST}`);
        console.log(`   Port: ${process.env.DB_PORT}`);
        console.log(`   Database: ${process.env.DB_NAME}`);
        console.log(`   User: ${process.env.DB_USER}`);
        
        // Forçar sincronização de todas as tabelas
        await sequelize.sync({ force: false, alter: true });
        
        console.log('✅ Sincronização concluída com sucesso!');
        console.log('📋 Tabelas criadas/atualizadas:');
        console.log('   - Users (com campo email)');
        console.log('   - Setors');
        console.log('   - UserSetors (relacionamento N:N)');
        console.log('   - SLAs');
        console.log('   - Tickets');
        console.log('   - Anotacaos');
        console.log('   - historicoTickets');
        console.log('   - RegistroDeAlteracaos');
        
        console.log('\n🎯 Funcionalidades habilitadas:');
        console.log('   - Usuários podem pertencer a múltiplos setores');
        console.log('   - Campo email obrigatório para usuários');
        console.log('   - API para gerenciar setores de usuários');
        console.log('   - Interface para adicionar/remover setores');
        
    } catch (error) {
        console.error('❌ Erro durante a sincronização:', error);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    syncDatabase();
}

module.exports = syncDatabase;

