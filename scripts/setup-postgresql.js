// Script para configurar PostgreSQL e migrar o sistema
const { Sequelize } = require('sequelize');
const config = require('../config/database');

async function setupPostgreSQL() {
    try {
        console.log('🔄 Configurando PostgreSQL...\n');
        
        const env = process.env.NODE_ENV || 'development';
        const dbConfig = config[env];
        
        console.log('📋 Configuração do banco:');
        console.log(`   - Host: ${dbConfig.host}`);
        console.log(`   - Port: ${dbConfig.port}`);
        console.log(`   - Database: ${dbConfig.database}`);
        console.log(`   - User: ${dbConfig.username}`);
        
        // Primeiro, conectar sem especificar o banco para criar o banco se não existir
        const sequelizeMaster = new Sequelize({
            username: dbConfig.username,
            password: dbConfig.password,
            host: dbConfig.host,
            port: dbConfig.port,
            dialect: 'postgres',
            logging: false
        });
        
        try {
            await sequelizeMaster.authenticate();
            console.log('✅ Conexão com PostgreSQL estabelecida');
            
            // Criar banco de dados se não existir
            try {
                await sequelizeMaster.query(`CREATE DATABASE "${dbConfig.database}"`);
                console.log(`✅ Banco de dados "${dbConfig.database}" criado`);
            } catch (error) {
                if (error.message.includes('already exists')) {
                    console.log(`ℹ️  Banco de dados "${dbConfig.database}" já existe`);
                } else {
                    throw error;
                }
            }
            
        } catch (error) {
            console.error('❌ Erro ao conectar com PostgreSQL:', error.message);
            console.log('\n📋 Para resolver:');
            console.log('1. Instale o PostgreSQL: https://www.postgresql.org/download/');
            console.log('2. Configure as variáveis de ambiente no arquivo .env');
            console.log('3. Certifique-se de que o PostgreSQL está rodando');
            return;
        } finally {
            await sequelizeMaster.close();
        }
        
        // Agora conectar ao banco específico
        const sequelize = new Sequelize({
            username: dbConfig.username,
            password: dbConfig.password,
            host: dbConfig.host,
            port: dbConfig.port,
            database: dbConfig.database,
            dialect: 'postgres',
            logging: false
        });
        
        await sequelize.authenticate();
        console.log(`✅ Conectado ao banco "${dbConfig.database}"`);
        
        // Verificar se há tabelas existentes
        const [results] = await sequelize.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        
        if (results.length > 0) {
            console.log('\n⚠️  Tabelas existentes encontradas:');
            results.forEach(table => {
                console.log(`   - ${table.table_name}`);
            });
            
            console.log('\n🔄 Removendo tabelas existentes...');
            await sequelize.query('DROP SCHEMA public CASCADE');
            await sequelize.query('CREATE SCHEMA public');
            console.log('✅ Tabelas removidas');
        }
        
        await sequelize.close();
        
        console.log('\n🎉 PostgreSQL configurado com sucesso!');
        console.log('\n📋 Próximos passos:');
        console.log('1. Execute: node server.js');
        console.log('2. As tabelas serão criadas automaticamente');
        console.log('3. O usuário admin será criado automaticamente');
        
    } catch (error) {
        console.error('❌ Erro durante a configuração:', error);
    }
}

// Executar configuração
setupPostgreSQL();





