// scripts/fix-enum-issues.js
const { Sequelize } = require('sequelize');
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

async function fixEnumIssues() {
    try {
        console.log('🔧 Corrigindo problemas de ENUM no PostgreSQL...\n');
        
        await sequelize.authenticate();
        console.log('✅ Conexão com PostgreSQL estabelecida.');

        // Verificar se existe o tipo ENUM problemático
        const enumExists = await sequelize.query(`
            SELECT EXISTS (
                SELECT 1 FROM pg_type 
                WHERE typname = 'enum_Users_role'
            );
        `);
        
        if (enumExists[0][0].exists) {
            console.log('⚠️  Tipo ENUM encontrado. Convertendo para VARCHAR...');
            
            // Converter a coluna role para VARCHAR
            await sequelize.query(`
                ALTER TABLE "Users" 
                ALTER COLUMN "role" TYPE VARCHAR(255) 
                USING "role"::VARCHAR(255);
            `);
            
            // Remover o tipo ENUM
            await sequelize.query(`
                DROP TYPE IF EXISTS "enum_Users_role";
            `);
            
            console.log('✅ Conversão concluída com sucesso!');
        } else {
            console.log('✅ Nenhum tipo ENUM problemático encontrado.');
        }

        // Verificar se há outros tipos ENUM
        const allEnums = await sequelize.query(`
            SELECT typname 
            FROM pg_type 
            WHERE typtype = 'e' 
            AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
        `);
        
        if (allEnums[0].length > 0) {
            console.log('📋 Tipos ENUM encontrados:');
            allEnums[0].forEach(enumType => {
                console.log(`  - ${enumType.typname}`);
            });
        } else {
            console.log('✅ Nenhum tipo ENUM encontrado no banco.');
        }

        // Verificar estrutura da tabela Users
        console.log('\n🔍 Verificando estrutura da tabela Users:');
        const userStructure = await sequelize.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'Users'
            ORDER BY ordinal_position
        `);
        
        userStructure[0].forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
        });

        console.log('\n🎉 Correção concluída!');
        console.log('✅ Agora você pode reiniciar o servidor sem problemas.');

    } catch (error) {
        console.error('❌ Erro durante a correção:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        await sequelize.close();
    }
}

fixEnumIssues();






