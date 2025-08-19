// scripts/fix-postgres-enums.js
const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

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

async function fixEnums() {
    try {
        console.log('🔧 Corrigindo tipos ENUM no PostgreSQL...\n');
        
        // Testar conexão
        await sequelize.authenticate();
        console.log('✅ Conexão estabelecida.');
        
        // Verificar se as tabelas existem
        const tables = await sequelize.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('Tickets', 'Users', 'Setors')
            ORDER BY table_name
        `);
        
        console.log('📋 Tabelas encontradas:', tables[0].map(t => t.table_name));
        
        // Corrigir tabela Tickets
        console.log('\n🔄 Corrigindo tabela Tickets...');
        
        // Primeiro, remover constraints e colunas problemáticas
        await sequelize.query(`
            DO $$ 
            BEGIN
                -- Remover colunas adicionais se existirem
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Tickets' AND column_name = 'areaResponsavel') THEN
                    ALTER TABLE "Tickets" DROP COLUMN "areaResponsavel";
                END IF;
                
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Tickets' AND column_name = 'usuarioResponsavel') THEN
                    ALTER TABLE "Tickets" DROP COLUMN "usuarioResponsavel";
                END IF;
                
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Tickets' AND column_name = 'usuarioCriador') THEN
                    ALTER TABLE "Tickets" DROP COLUMN "usuarioCriador";
                END IF;
                
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Tickets' AND column_name = 'dataEncerramento') THEN
                    ALTER TABLE "Tickets" DROP COLUMN "dataEncerramento";
                END IF;
            END $$;
        `);
        
        // Converter coluna status para VARCHAR temporariamente
        await sequelize.query(`
            ALTER TABLE "Tickets" 
            ALTER COLUMN "status" TYPE VARCHAR(255) 
            USING "status"::VARCHAR(255);
        `);
        
        // Converter coluna prioridade para VARCHAR temporariamente
        await sequelize.query(`
            ALTER TABLE "Tickets" 
            ALTER COLUMN "prioridade" TYPE VARCHAR(255) 
            USING "prioridade"::VARCHAR(255);
        `);
        
        // Remover tipos ENUM existentes
        await sequelize.query(`
            DROP TYPE IF EXISTS "enum_Tickets_status" CASCADE;
            DROP TYPE IF EXISTS "enum_Tickets_prioridade" CASCADE;
        `);
        
        console.log('✅ Colunas corrigidas.');
        
        // Recriar tabelas com estrutura correta
        console.log('\n🔄 Recriando estrutura das tabelas...');
        
        // Dropar tabelas existentes
        await sequelize.query(`
            DROP TABLE IF EXISTS "Tickets" CASCADE;
            DROP TABLE IF EXISTS "Users" CASCADE;
            DROP TABLE IF EXISTS "Setors" CASCADE;
            DROP TABLE IF EXISTS "Anotacaos" CASCADE;
            DROP TABLE IF EXISTS "historicoTickets" CASCADE;
            DROP TABLE IF EXISTS "RegistroDeAlteracaos" CASCADE;
        `);
        
        console.log('✅ Tabelas removidas.');
        
        // Criar tabelas com estrutura correta
        await sequelize.query(`
            CREATE TABLE "Users" (
                "id" SERIAL PRIMARY KEY,
                "username" VARCHAR(255) NOT NULL UNIQUE,
                "password" VARCHAR(255) NOT NULL,
                "role" VARCHAR(255) NOT NULL,
                "setor" VARCHAR(255) NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
            );
            
            CREATE TABLE "Setors" (
                "id" SERIAL PRIMARY KEY,
                "nome" VARCHAR(255) NOT NULL UNIQUE,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
            );
            
            CREATE TABLE "Tickets" (
                "id" SERIAL PRIMARY KEY,
                "titulo" VARCHAR(255) NOT NULL,
                "descricao" TEXT NOT NULL,
                "status" VARCHAR(255) NOT NULL DEFAULT 'aberto',
                "prioridade" VARCHAR(255) NOT NULL DEFAULT 'media',
                "setor" VARCHAR(255) NOT NULL,
                "solicitante" VARCHAR(255) NOT NULL,
                "responsavel" VARCHAR(255),
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
            );
            
            CREATE TABLE "Anotacaos" (
                "id" SERIAL PRIMARY KEY,
                "ticketId" INTEGER NOT NULL,
                "conteudo" TEXT NOT NULL,
                "autor" VARCHAR(255) NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
            );
            
            CREATE TABLE "historicoTickets" (
                "id" SERIAL PRIMARY KEY,
                "ticketId" INTEGER NOT NULL,
                "alteracao" VARCHAR(255) NOT NULL,
                "usuario" VARCHAR(255) NOT NULL,
                "dataAlteracao" TIMESTAMP WITH TIME ZONE NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
            );
            
            CREATE TABLE "RegistroDeAlteracaos" (
                "id" SERIAL PRIMARY KEY,
                "ticketId" INTEGER NOT NULL,
                "campo" VARCHAR(255) NOT NULL,
                "valorAnterior" VARCHAR(255),
                "valorNovo" VARCHAR(255),
                "usuario" VARCHAR(255) NOT NULL,
                "dataAlteracao" TIMESTAMP WITH TIME ZONE NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
            );
        `);
        
        console.log('✅ Tabelas criadas com estrutura correta.');
        
        // Criar usuário admin padrão
        console.log('\n👤 Criando usuário admin padrão...');
        await sequelize.query(`
            INSERT INTO "Users" ("username", "password", "role", "setor", "createdAt", "updatedAt")
            VALUES ('admin', 'adminpassword', 'admin', 'Administração', NOW(), NOW());
        `);
        
        // Criar setor padrão
        console.log('🏢 Criando setor padrão...');
        await sequelize.query(`
            INSERT INTO "Setors" ("nome", "createdAt", "updatedAt")
            VALUES ('Administração', NOW(), NOW());
        `);
        
        console.log('\n🎉 Estrutura do banco corrigida com sucesso!');
        console.log('✅ Agora você pode executar a migração de dados.');
        
    } catch (error) {
        console.error('❌ Erro ao corrigir estrutura:', error.message);
        console.error('Detalhes:', error);
    } finally {
        await sequelize.close();
    }
}

// Executar correção
fixEnums();






