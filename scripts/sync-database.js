// Script para sincronizar o banco de dados
const { sequelize } = require('../models');

async function syncDatabase() {
    try {
        console.log('🔄 Iniciando sincronização do banco de dados...');
        
        // Forçar sincronização de todas as tabelas
        await sequelize.sync({ force: false, alter: true });
        
        console.log('✅ Sincronização concluída com sucesso!');
        console.log('📋 Tabelas criadas/atualizadas:');
        console.log('   - Users (com campo setor mantido para compatibilidade)');
        console.log('   - Setors');
        console.log('   - UserSetors (nova tabela de relacionamento)');
        console.log('   - SLAs');
        console.log('   - Tickets');
        console.log('   - Anotacaos');
        console.log('   - historicoTickets');
        console.log('   - RegistroDeAlteracaos');
        
        console.log('\n🎯 Funcionalidades habilitadas:');
        console.log('   - Usuários podem pertencer a múltiplos setores');
        console.log('   - Setor principal mantido para compatibilidade');
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


