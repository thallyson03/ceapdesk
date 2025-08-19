// scripts/test-postgres-connection.js
const { Sequelize } = require('sequelize');
const config = require('../config/database');

async function testConnection() {
    const env = process.env.NODE_ENV || 'development';
    const dbConfig = config[env];
    
    console.log('Testando conexão com PostgreSQL...');
    console.log('Configurações:', {
        host: dbConfig.host,
        port: dbConfig.port,
        database: dbConfig.database,
        username: dbConfig.username,
        dialect: dbConfig.dialect
    });
    
    const sequelize = new Sequelize(
        dbConfig.database,
        dbConfig.username,
        dbConfig.password,
        {
            host: dbConfig.host,
            port: dbConfig.port,
            dialect: dbConfig.dialect,
            logging: false
        }
    );
    
    try {
        // Testar conexão
        await sequelize.authenticate();
        console.log('✅ Conexão com PostgreSQL estabelecida com sucesso!');
        
        // Testar se o banco existe
        const result = await sequelize.query('SELECT current_database() as db_name, version() as version');
        console.log('📊 Banco atual:', result[0][0].db_name);
        console.log('🔧 Versão PostgreSQL:', result[0][0].version.split(' ')[0]);
        
        // Testar permissões
        const permissions = await sequelize.query(`
            SELECT 
                has_database_privilege(current_user, current_database(), 'CREATE') as can_create,
                has_database_privilege(current_user, current_database(), 'CONNECT') as can_connect,
                has_database_privilege(current_user, current_database(), 'TEMPORARY') as can_temp
        `);
        
        const perms = permissions[0][0];
        console.log('🔐 Permissões:');
        console.log('  - Criar tabelas:', perms.can_create ? '✅' : '❌');
        console.log('  - Conectar:', perms.can_connect ? '✅' : '❌');
        console.log('  - Criar tabelas temporárias:', perms.can_temp ? '✅' : '❌');
        
        // Listar tabelas existentes (se houver)
        const tables = await sequelize.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        
        if (tables[0].length > 0) {
            console.log('📋 Tabelas existentes:');
            tables[0].forEach(table => {
                console.log(`  - ${table.table_name}`);
            });
        } else {
            console.log('📋 Nenhuma tabela encontrada (banco vazio)');
        }
        
    } catch (error) {
        console.error('❌ Erro ao conectar com PostgreSQL:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Possíveis soluções:');
            console.log('1. Verifique se o PostgreSQL está rodando');
            console.log('2. Verifique se a porta está correta');
            console.log('3. Verifique se o host está correto');
        } else if (error.code === '28P01') {
            console.log('\n💡 Erro de autenticação:');
            console.log('1. Verifique o usuário e senha no arquivo .env');
            console.log('2. Verifique se o usuário tem acesso ao banco');
        } else if (error.code === '3D000') {
            console.log('\n💡 Banco não encontrado:');
            console.log('1. Execute o script create-database.sql primeiro');
            console.log('2. Verifique o nome do banco no arquivo .env');
        }
        
        process.exit(1);
    } finally {
        await sequelize.close();
        console.log('\n🔌 Conexão fechada.');
    }
}

// Executar teste
testConnection();






