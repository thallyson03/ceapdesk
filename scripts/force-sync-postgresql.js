// Script para forçar a sincronização das tabelas no PostgreSQL
const { sequelize } = require('../models');

async function forceSyncPostgreSQL() {
    try {
        console.log('🔄 Forçando sincronização das tabelas no PostgreSQL...\n');
        
        // Testar conexão
        await sequelize.authenticate();
        console.log('✅ Conexão com PostgreSQL estabelecida');
        
        // Forçar sincronização (recriar todas as tabelas)
        console.log('🔄 Recriando todas as tabelas...');
        await sequelize.sync({ force: true });
        console.log('✅ Tabelas criadas com sucesso!');
        
        // Verificar tabelas criadas
        const [results] = await sequelize.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        
        console.log('\n📋 Tabelas criadas:');
        results.forEach(table => {
            console.log(`   - ${table.table_name}`);
        });
        
        console.log('\n🎉 Migração para PostgreSQL concluída com sucesso!');
        console.log('\n📋 Próximos passos:');
        console.log('1. Execute: node server.js');
        console.log('2. O usuário admin será criado automaticamente');
        console.log('3. O setor "Administração" será criado automaticamente');
        
    } catch (error) {
        console.error('❌ Erro durante a migração:', error);
        console.log('\n📋 Possíveis soluções:');
        console.log('1. Verifique se o PostgreSQL está rodando');
        console.log('2. Verifique as credenciais no arquivo .env');
        console.log('3. Certifique-se de que o usuário postgres tem permissões');
    } finally {
        await sequelize.close();
    }
}

// Executar migração
forceSyncPostgreSQL();





