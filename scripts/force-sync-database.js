// Script para forçar a sincronização do banco de dados
const { sequelize } = require('../models');

async function forceSyncDatabase() {
    try {
        console.log('🔄 Forçando sincronização do banco de dados...');
        console.log('⚠️  ATENÇÃO: Isso irá recriar todas as tabelas!');
        
        await sequelize.sync({ force: true });
        
        console.log('✅ Banco de dados sincronizado com sucesso!');
        
        // Verificar tabelas criadas
        const [results] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table'");
        
        console.log('\n📋 Tabelas criadas:');
        results.forEach(table => {
            console.log(`   - ${table.name}`);
        });
        
    } catch (error) {
        console.error('❌ Erro ao sincronizar banco de dados:', error);
    } finally {
        await sequelize.close();
    }
}

// Executar sincronização forçada
forceSyncDatabase();





