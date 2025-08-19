const { User, Setor } = require('../models');

async function createTestUser() {
    try {
        console.log('🧪 Criando usuário de teste...\n');
        
        // 1. Criar usuário de teste
        console.log('1️⃣ Criando usuário...');
        const user = await User.create({
            username: 'teste',
            password: '123456',
            role: 'admin'
        });
        
        console.log(`   ✅ Usuário criado: ${user.username} (ID: ${user.id})`);
        
        // 2. Buscar setores disponíveis
        console.log('\n2️⃣ Buscando setores disponíveis...');
        const setores = await Setor.findAll();
        console.log(`   📋 Setores encontrados: ${setores.length}`);
        setores.forEach(setor => {
            console.log(`      - ID: ${setor.id}, Nome: ${setor.nome}`);
        });
        
        // 3. Adicionar setores ao usuário
        console.log('\n3️⃣ Adicionando setores ao usuário...');
        if (setores.length > 0) {
            // Adicionar os primeiros 3 setores
            const setoresParaAdicionar = setores.slice(0, 3);
            await user.setSetores(setoresParaAdicionar);
            
            console.log(`   ✅ Setores adicionados: ${setoresParaAdicionar.map(s => s.nome).join(', ')}`);
        }
        
        // 4. Verificar usuário com setores
        console.log('\n4️⃣ Verificando usuário com setores...');
        const userComSetores = await User.findByPk(user.id, {
            include: [{
                model: Setor,
                as: 'setores',
                attributes: ['id', 'nome'],
                through: { attributes: [] }
            }]
        });
        
        console.log(`   📍 Usuário: ${userComSetores.username}`);
        console.log(`   🏷️  Setores: ${userComSetores.setores.map(s => s.nome).join(', ')}`);
        
        console.log('\n✅ Usuário de teste criado com sucesso!');
        console.log('\n🎯 Credenciais de teste:');
        console.log('   - Username: teste');
        console.log('   - Password: 123456');
        console.log('   - Role: admin');
        
    } catch (error) {
        console.error('❌ Erro ao criar usuário de teste:', error);
        console.error('Stack trace:', error.stack);
    } finally {
        await require('../models').sequelize.close();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    createTestUser();
}

module.exports = createTestUser;
