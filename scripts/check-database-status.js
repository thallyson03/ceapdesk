// scripts/check-database-status.js
require('dotenv').config();
const { sequelize, User, Setor, Ticket, SLA } = require('../models/index');

async function checkDatabaseStatus() {
    try {
        console.log('🔍 Verificando status do banco de dados...\n');

        // Testar conexão
        await sequelize.authenticate();
        console.log('✅ Conexão com PostgreSQL estabelecida com sucesso');

        // Verificar se as tabelas existem
        const tables = await sequelize.showAllSchemas();
        console.log('\n📋 Schemas disponíveis:', tables.map(t => t.name));

        // Verificar tabelas no schema public
        const tableNames = await sequelize.query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
            { type: sequelize.QueryTypes.SELECT }
        );
        
        console.log('\n📊 Tabelas no schema public:');
        tableNames.forEach(table => {
            console.log(`  - ${table.table_name}`);
        });

        // Verificar dados nas tabelas principais
        console.log('\n📈 Contagem de registros:');
        
        try {
            const userCount = await User.count();
            console.log(`  👥 Users: ${userCount} registros`);
            
            if (userCount > 0) {
                const users = await User.findAll({ attributes: ['id', 'username', 'role', 'createdAt'] });
                users.forEach(user => {
                    console.log(`    - ${user.username} (${user.role}) - Criado em: ${user.createdAt}`);
                });
            }
        } catch (error) {
            console.log(`  ❌ Erro ao verificar Users: ${error.message}`);
        }

        try {
            const setorCount = await Setor.count();
            console.log(`  🏢 Setors: ${setorCount} registros`);
            
            if (setorCount > 0) {
                const setores = await Setor.findAll({ attributes: ['id', 'nome', 'createdAt'] });
                setores.forEach(setor => {
                    console.log(`    - ${setor.nome} - Criado em: ${setor.createdAt}`);
                });
            }
        } catch (error) {
            console.log(`  ❌ Erro ao verificar Setors: ${error.message}`);
        }

        try {
            const ticketCount = await Ticket.count();
            console.log(`  🎫 Tickets: ${ticketCount} registros`);
        } catch (error) {
            console.log(`  ❌ Erro ao verificar Tickets: ${error.message}`);
        }

        try {
            const slaCount = await SLA.count();
            console.log(`  ⏰ SLAs: ${slaCount} registros`);
        } catch (error) {
            console.log(`  ❌ Erro ao verificar SLAs: ${error.message}`);
        }

        // Verificar configurações do banco
        console.log('\n⚙️ Configurações do banco:');
        console.log(`  Database: ${sequelize.config.database}`);
        console.log(`  Host: ${sequelize.config.host}`);
        console.log(`  Port: ${sequelize.config.port}`);
        console.log(`  Username: ${sequelize.config.username}`);
        console.log(`  Dialect: ${sequelize.config.dialect}`);

        // Verificar variáveis de ambiente
        console.log('\n🔧 Variáveis de ambiente:');
        console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'não definido'}`);
        console.log(`  DB_NAME: ${process.env.DB_NAME || 'não definido'}`);
        console.log(`  DB_HOST: ${process.env.DB_HOST || 'não definido'}`);
        console.log(`  DB_PORT: ${process.env.DB_PORT || 'não definido'}`);

        await sequelize.close();
        console.log('\n✅ Verificação concluída');

    } catch (error) {
        console.error('❌ Erro durante a verificação:', error);
        process.exit(1);
    }
}

checkDatabaseStatus();
