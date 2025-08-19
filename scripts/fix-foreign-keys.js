const { sequelize } = require('../models');

async function fixForeignKeys() {
    try {
        console.log('🔧 Corrigindo chaves estrangeiras...\n');
        
        // 1. Remover a chave estrangeira incorreta
        console.log('1️⃣ Removendo chave estrangeira incorreta...');
        await sequelize.query(`
            ALTER TABLE "UserSetors" 
            DROP CONSTRAINT "UserSetors_userId_fkey"
        `);
        console.log('   ✅ Chave estrangeira incorreta removida');
        
        // 2. Verificar se a chave estrangeira correta ainda existe
        console.log('\n2️⃣ Verificando chave estrangeira correta...');
        const foreignKeys = await sequelize.query(`
            SELECT 
                tc.constraint_name,
                tc.table_name,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_name = 'UserSetors'
        `, { type: sequelize.QueryTypes.SELECT });
        
        console.log('   📋 Chaves estrangeiras restantes:');
        foreignKeys.forEach(fk => {
            console.log(`      - ${fk.constraint_name}: ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
        });
        
        // 3. Verificar se há dados na tabela Users antiga
        console.log('\n3️⃣ Verificando dados na tabela Users antiga...');
        const usersOldData = await sequelize.query(`
            SELECT id, username, role
            FROM "Users"
            ORDER BY id
        `, { type: sequelize.QueryTypes.SELECT });
        
        console.log(`   📋 Usuários na tabela Users (antiga): ${usersOldData.length}`);
        if (usersOldData.length > 0) {
            console.log('   ⚠️  Há dados na tabela antiga que podem ser perdidos');
        }
        
        // 4. Verificar dados na tabela users nova
        console.log('\n4️⃣ Verificando dados na tabela users nova...');
        const usersNewData = await sequelize.query(`
            SELECT id, username, role
            FROM users
            ORDER BY id
        `, { type: sequelize.QueryTypes.SELECT });
        
        console.log(`   📋 Usuários na tabela users (nova): ${usersNewData.length}`);
        usersNewData.forEach(user => {
            console.log(`      - ID: ${user.id}, Username: ${user.username}, Role: ${user.role}`);
        });
        
        // 5. Testar inserção na tabela UserSetors
        console.log('\n5️⃣ Testando inserção na tabela UserSetors...');
        try {
            await sequelize.query(`
                INSERT INTO "UserSetors" ("userId", "setorId", "createdAt", "updatedAt")
                VALUES (1, 1, NOW(), NOW())
            `);
            console.log('   ✅ Inserção de teste bem-sucedida');
            
            // Remover o registro de teste
            await sequelize.query(`
                DELETE FROM "UserSetors" 
                WHERE "userId" = 1 AND "setorId" = 1
            `);
            console.log('   ✅ Registro de teste removido');
        } catch (error) {
            console.log('   ❌ Erro na inserção de teste:', error.message);
        }
        
        console.log('\n✅ Correção das chaves estrangeiras concluída!');
        
    } catch (error) {
        console.error('❌ Erro durante correção:', error);
        console.error('Stack trace:', error.stack);
    } finally {
        await sequelize.close();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    fixForeignKeys();
}

module.exports = fixForeignKeys;
