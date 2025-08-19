const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/database');

// Configuração do banco
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

async function addEmailField() {
    try {
        console.log('🔄 Adicionando campo email aos usuários...');
        
        // Verificar se a coluna email já existe
        const [results] = await sequelize.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'Users' 
            AND column_name = 'email'
        `);
        
        if (results.length > 0) {
            console.log('✅ Campo email já existe na tabela Users');
            return;
        }
        
        // Adicionar coluna email
        await sequelize.query(`
            ALTER TABLE "Users" 
            ADD COLUMN "email" VARCHAR(255) UNIQUE
        `);
        
        console.log('✅ Campo email adicionado com sucesso!');
        
        // Atualizar usuários existentes com email padrão
        const [users] = await sequelize.query(`
            SELECT id, username FROM "Users"
        `);
        
        for (const user of users) {
            const defaultEmail = `${user.username}@sistema-tickets.local`;
            await sequelize.query(`
                UPDATE "Users" 
                SET "email" = ? 
                WHERE id = ?
            `, {
                replacements: [defaultEmail, user.id]
            });
        }
        
        console.log(`✅ ${users.length} usuários atualizados com email padrão`);
        console.log('💡 IMPORTANTE: Atualize os emails dos usuários para emails válidos!');
        
    } catch (error) {
        console.error('❌ Erro ao adicionar campo email:', error);
        throw error;
    } finally {
        await sequelize.close();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    addEmailField()
        .then(() => {
            console.log('🎯 Migração concluída com sucesso!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Erro na migração:', error);
            process.exit(1);
        });
}

module.exports = addEmailField;
