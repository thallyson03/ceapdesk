// Script para verificar a configuração do banco de dados
const { Sequelize } = require('sequelize');
const config = require('../config/database');

async function checkDatabase() {
    try {
        console.log('🔍 Verificando configuração do banco de dados...');
        
        const env = process.env.NODE_ENV || 'development';
        const dbConfig = config[env];
        
        console.log('\n📋 Configuração atual:');
        console.log('   - Ambiente:', env);
        console.log('   - Dialect:', dbConfig.dialect);
        console.log('   - Storage:', dbConfig.storage);
        
        // Criar nova conexão
        const sequelize = new Sequelize({
            dialect: dbConfig.dialect,
            storage: dbConfig.storage,
            logging: false
        });
        
        // Testar conexão
        await sequelize.authenticate();
        console.log('✅ Conexão com banco de dados estabelecida');
        
        // Verificar tabelas
        const [results] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table'");
        
        console.log('\n📋 Tabelas encontradas:');
        if (results.length === 0) {
            console.log('   - Nenhuma tabela encontrada');
        } else {
            results.forEach(table => {
                console.log(`   - ${table.name}`);
            });
        }
        
        await sequelize.close();
        
    } catch (error) {
        console.error('❌ Erro ao verificar banco:', error);
    }
}

// Executar verificação
checkDatabase();





