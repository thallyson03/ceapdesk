// scripts/check-table-structure.js
const { sequelize } = require('../models');

async function checkTableStructure() {
    try {
        console.log('🔍 Verificando estrutura das tabelas...\n');
        
        // Verificar tabela users
        console.log('1️⃣ Verificando tabela users...');
        const usersResult = await sequelize.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('users', 'Users')
        `, { type: sequelize.QueryTypes.SELECT });
        
        console.log('   📋 Tabelas encontradas:');
        usersResult.forEach(row => {
            console.log(`      - ${row.table_name}`);
        });
        
        // Verificar estrutura da tabela users
        console.log('\n2️⃣ Verificando estrutura da tabela users...');
        const usersStructure = await sequelize.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'users'
            ORDER BY ordinal_position
        `, { type: sequelize.QueryTypes.SELECT });
        
        console.log('   📋 Colunas da tabela users:');
        usersStructure.forEach(col => {
            console.log(`      - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
        });
        
        // Verificar chaves estrangeiras da tabela UserSetors
        console.log('\n3️⃣ Verificando chaves estrangeiras da tabela UserSetors...');
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
        
        console.log('   📋 Chaves estrangeiras da tabela UserSetors:');
        foreignKeys.forEach(fk => {
            console.log(`      - ${fk.constraint_name}: ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
        });
        
        // Verificar dados na tabela users
        console.log('\n4️⃣ Verificando dados na tabela users...');
        const usersData = await sequelize.query(`
            SELECT id, username, role
            FROM users
            ORDER BY id
        `, { type: sequelize.QueryTypes.SELECT });
        
        console.log('   📋 Usuários na tabela users:');
        usersData.forEach(user => {
            console.log(`      - ID: ${user.id}, Username: ${user.username}, Role: ${user.role}`);
        });
        
        // Verificar dados na tabela UserSetors
        console.log('\n5️⃣ Verificando dados na tabela UserSetors...');
        const userSetorsData = await sequelize.query(`
            SELECT userId, setorId
            FROM "UserSetors"
            ORDER BY userId, setorId
        `, { type: sequelize.QueryTypes.SELECT });
        
        console.log('   📋 Relacionamentos na tabela UserSetors:');
        if (userSetorsData.length === 0) {
            console.log('      - Nenhum relacionamento encontrado');
        } else {
            userSetorsData.forEach(rel => {
                console.log(`      - User ID: ${rel.userid}, Setor ID: ${rel.setorid}`);
            });
        }
        
        console.log('\n✅ Verificação da estrutura concluída!');
        
    } catch (error) {
        console.error('❌ Erro durante verificação:', error);
        console.error('Stack trace:', error.stack);
    } finally {
        await sequelize.close();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    checkTableStructure();
}

module.exports = checkTableStructure;



