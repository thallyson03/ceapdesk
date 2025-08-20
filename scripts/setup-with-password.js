#!/usr/bin/env node

const { Client } = require('pg');

async function setupWithPassword() {
    console.log('🗄️ Configurando banco de dados com senha postgres123...');
    
    const config = {
        user: 'postgres',
        password: 'postgres123',
        database: 'postgres',
        host: 'localhost',
        port: 5432
    };

    const client = new Client(config);
    let dbClient = null;

    try {
        await client.connect();
        console.log('✅ Conectado ao PostgreSQL com sucesso!');

        // Verificar se o database existe
        const dbExists = await client.query(`
            SELECT 1 FROM pg_database WHERE datname = 'sistema_tickets_dev'
        `);

        if (dbExists.rows.length === 0) {
            console.log('📝 Criando database sistema_tickets_dev...');
            await client.query(`CREATE DATABASE sistema_tickets_dev`);
            console.log('✅ Database sistema_tickets_dev criado!');
        } else {
            console.log('✅ Database sistema_tickets_dev já existe');
        }

        await client.end();

        // Conectar ao database específico
        dbClient = new Client({
            ...config,
            database: 'sistema_tickets_dev'
        });

        await dbClient.connect();
        console.log('✅ Conectado ao database sistema_tickets_dev');

        // Verificar se a tabela users existe
        const tableExists = await dbClient.query(`
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'users'
        `);

        if (tableExists.rows.length > 0) {
            console.log('✅ Tabela users existe');
            
            // Verificar se a coluna email existe
            const columnExists = await dbClient.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'email'
            `);

            if (columnExists.rows.length === 0) {
                console.log('📝 Adicionando coluna email...');
                
                // Adicionar a coluna email
                await dbClient.query(`
                    ALTER TABLE users 
                    ADD COLUMN email VARCHAR(255) UNIQUE
                `);
                
                console.log('✅ Coluna email adicionada!');
                
                // Atualizar registros existentes
                await dbClient.query(`
                    UPDATE users 
                    SET email = username || '@sistema.local' 
                    WHERE email IS NULL
                `);
                
                // Tornar NOT NULL
                await dbClient.query(`
                    ALTER TABLE users 
                    ALTER COLUMN email SET NOT NULL
                `);
                
                console.log('✅ Registros atualizados');
            } else {
                console.log('✅ Coluna email já existe');
            }
        } else {
            console.log('⚠️ Tabela users não existe. Execute npm run sync-db primeiro');
        }

        console.log('');
        console.log('🎉 Configuração concluída!');
        console.log('');
        console.log('📋 Próximos passos:');
        console.log('1. Execute: npm run sync-db');
        console.log('2. Execute: npm run dev');
        console.log('');
        console.log('💡 Configurações salvas:');
        console.log('DB_USER=postgres');
        console.log('DB_PASSWORD=postgres123');
        console.log('DB_NAME=sistema_tickets_dev');
        console.log('DB_HOST=localhost');
        console.log('DB_PORT=5432');

    } catch (error) {
        console.error('❌ Erro:', error.message);
        process.exit(1);
    } finally {
        if (dbClient) {
            await dbClient.end();
        }
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    setupWithPassword();
}

module.exports = setupWithPassword;
