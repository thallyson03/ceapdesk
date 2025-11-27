// Script para adicionar coluna deletedAt na tabela Tickets
// Execute: node scripts/add-deletedAt-column.js

require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME || 'sistema_tickets_dev',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'postgres',
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: console.log
    }
);

async function addDeletedAtColumn() {
    try {
        console.log('🔌 Conectando ao banco de dados...');
        await sequelize.authenticate();
        console.log('✅ Conexão estabelecida com sucesso.');

        // Verificar se a coluna já existe
        const [results] = await sequelize.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'Tickets' 
            AND column_name = 'deletedAt'
        `);

        if (results.length > 0) {
            console.log('ℹ️  Coluna deletedAt já existe na tabela Tickets.');
            return;
        }

        // Adicionar coluna deletedAt
        console.log('📝 Adicionando coluna deletedAt...');
        await sequelize.query(`
            ALTER TABLE "Tickets" 
            ADD COLUMN "deletedAt" TIMESTAMP NULL
        `);

        console.log('✅ Coluna deletedAt adicionada com sucesso!');
        console.log('✅ Soft delete agora está funcionando corretamente.');

    } catch (error) {
        console.error('❌ Erro ao adicionar coluna deletedAt:', error.message);
        console.error('Detalhes:', error);
        process.exit(1);
    } finally {
        await sequelize.close();
        console.log('🔌 Conexão fechada.');
    }
}

addDeletedAtColumn();


