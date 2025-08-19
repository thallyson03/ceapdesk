// Script para verificar tabelas no banco de dados
const { sequelize } = require('../models');

async function checkTables() {
    try {
        console.log('🔍 Verificando tabelas no banco de dados...');
        
        // Listar todas as tabelas
        const [results] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table'");
        
        console.log('📋 Tabelas encontradas:');
        results.forEach(table => {
            console.log(`   - ${table.name}`);
        });
        
        // Verificar se as tabelas principais existem
        const expectedTables = ['Users', 'Setors', 'Tickets', 'SLAs', 'HistoricoTickets', 'Anotacaos'];
        
        console.log('\n✅ Verificação de tabelas esperadas:');
        expectedTables.forEach(tableName => {
            const exists = results.some(table => table.name === tableName);
            console.log(`   - ${tableName}: ${exists ? '✅ Existe' : '❌ Não existe'}`);
        });
        
    } catch (error) {
        console.error('❌ Erro ao verificar tabelas:', error);
    } finally {
        await sequelize.close();
    }
}

// Executar verificação
checkTables();





