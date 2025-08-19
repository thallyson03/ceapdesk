const { User, Setor } = require('../models');

async function assignSetoresToUsers() {
    try {
        console.log('🧪 Atribuindo setores aos usuários...\n');
        
        // 1. Buscar todos os usuários
        console.log('1️⃣ Buscando todos os usuários...');
        const users = await User.findAll({
            include: [{
                model: Setor,
                as: 'setores',
                attributes: ['id', 'nome'],
                through: { attributes: [] }
            }]
        });
        
        console.log(`   ✅ Usuários encontrados: ${users.length}`);
        
        // 2. Buscar setores disponíveis
        console.log('\n2️⃣ Buscando setores disponíveis...');
        const setores = await Setor.findAll();
        console.log(`   ✅ Setores disponíveis: ${setores.length}`);
        setores.forEach(setor => {
            console.log(`      - ${setor.nome} (ID: ${setor.id})`);
        });
        
        if (setores.length === 0) {
            console.log('   ❌ Nenhum setor disponível');
            return;
        }
        
        // 3. Atribuir setores aos usuários que não têm
        console.log('\n3️⃣ Atribuindo setores...');
        let assignedCount = 0;
        
        for (const user of users) {
            if (user.setores.length === 0) {
                // Atribuir o primeiro setor disponível
                const setorToAssign = setores[0];
                await user.addSetores(setorToAssign);
                
                console.log(`   ✅ Setor "${setorToAssign.nome}" atribuído ao usuário "${user.username}"`);
                assignedCount++;
            } else {
                console.log(`   ℹ️  Usuário "${user.username}" já tem setores: ${user.setores.map(s => s.nome).join(', ')}`);
            }
        }
        
        // 4. Verificar resultado
        console.log('\n4️⃣ Verificando resultado...');
        const updatedUsers = await User.findAll({
            include: [{
                model: Setor,
                as: 'setores',
                attributes: ['id', 'nome'],
                through: { attributes: [] }
            }]
        });
        
        console.log('   📋 Status final dos usuários:');
        updatedUsers.forEach(user => {
            const setoresList = user.setores.length > 0 
                ? user.setores.map(s => s.nome).join(', ')
                : 'Sem setores';
            console.log(`      - ${user.username} (${user.role}): ${setoresList}`);
        });
        
        console.log('\n✅ Atribuição de setores concluída!');
        console.log(`\n🎯 Resumo:`);
        console.log(`   - Usuários processados: ${users.length}`);
        console.log(`   - Setores atribuídos: ${assignedCount}`);
        console.log(`   - Usuários com setores: ${updatedUsers.filter(u => u.setores.length > 0).length}`);
        
    } catch (error) {
        console.error('❌ Erro durante a atribuição:', error);
        console.error('Stack trace:', error.stack);
    } finally {
        await require('../models').sequelize.close();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    assignSetoresToUsers();
}

module.exports = assignSetoresToUsers;
