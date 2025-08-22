// scripts/add-client-fields.js
const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/database');

async function addClientFields() {
    // Usar configuração de desenvolvimento por padrão
    const dbConfig = config.development;
    
    const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: dbConfig.dialect,
        logging: false,
        define: dbConfig.define,
        pool: dbConfig.pool
    });

    try {
        console.log('🔧 Iniciando migração para adicionar campos de cliente...');

        // Verificar se os campos já existem
        const [results] = await sequelize.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Tickets' 
            AND COLUMN_NAME IN ('cpfCnpj', 'nomeCliente', 'numeroContato')
        `);

        const existingColumns = results.map(row => row.COLUMN_NAME);

        if (existingColumns.includes('cpfCnpj') && existingColumns.includes('nomeCliente') && existingColumns.includes('numeroContato')) {
            console.log('✅ Campos cpfCnpj, nomeCliente e numeroContato já existem na tabela Tickets');
            return;
        }

        // Adicionar campo cpfCnpj se não existir
        if (!existingColumns.includes('cpfCnpj')) {
            await sequelize.query(`
                ALTER TABLE "Tickets" 
                ADD COLUMN "cpfCnpj" VARCHAR(18)
            `);
            console.log('✅ Campo cpfCnpj adicionado com sucesso');
        }

        // Adicionar campo nomeCliente se não existir
        if (!existingColumns.includes('nomeCliente')) {
            await sequelize.query(`
                ALTER TABLE "Tickets" 
                ADD COLUMN "nomeCliente" VARCHAR(255)
            `);
            console.log('✅ Campo nomeCliente adicionado com sucesso');
        }

        // Adicionar campo numeroContato se não existir
        if (!existingColumns.includes('numeroContato')) {
            await sequelize.query(`
                ALTER TABLE "Tickets" 
                ADD COLUMN "numeroContato" VARCHAR(20)
            `);
            console.log('✅ Campo numeroContato adicionado com sucesso');
        }

        console.log('🎉 Migração concluída com sucesso!');
        console.log('📝 Os novos campos estão disponíveis:');
        console.log('   - cpfCnpj: CPF ou CNPJ do cliente');
        console.log('   - nomeCliente: Nome completo do cliente');
        console.log('   - numeroContato: Número de telefone do cliente');

    } catch (error) {
        console.error('❌ Erro durante a migração:', error.message);
        throw error;
    } finally {
        await sequelize.close();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    addClientFields()
        .then(() => {
            console.log('✅ Script executado com sucesso');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Erro ao executar script:', error);
            process.exit(1);
        });
}

module.exports = addClientFields;
