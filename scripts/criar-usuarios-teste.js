const { User, Setor } = require('../models');

async function criarUsuariosTeste() {
    try {
        console.log('🧪 Criando usuários de teste...\n');
        
        // Buscar setores disponíveis
        const setores = await Setor.findAll();
        console.log(`📋 Setores disponíveis: ${setores.map(s => s.nome).join(', ')}`);
        
        // Usuários de teste para diferentes setores
        const usuariosTeste = [
            {
                username: 'usuario_ti_1',
                password: '123456',
                role: 'user',
                setores: ['TI']
            },
            {
                username: 'usuario_ti_2',
                password: '123456',
                role: 'user',
                setores: ['TI']
            },
            {
                username: 'usuario_recebimento_1',
                password: '123456',
                role: 'user',
                setores: ['RECEBIMENTO']
            },
            {
                username: 'usuario_recebimento_2',
                password: '123456',
                role: 'user',
                setores: ['RECEBIMENTO']
            },
            {
                username: 'usuario_multi_setores',
                password: '123456',
                role: 'user',
                setores: ['TI', 'RECEBIMENTO']
            }
        ];
        
        console.log('1️⃣ Criando usuários...');
        
        for (const usuarioData of usuariosTeste) {
            try {
                // Verificar se o usuário já existe
                const existingUser = await User.findOne({
                    where: { username: usuarioData.username }
                });
                
                if (existingUser) {
                    console.log(`   ⚠️  Usuário ${usuarioData.username} já existe, pulando...`);
                    continue;
                }
                
                // Criar usuário
                const user = await User.create({
                    username: usuarioData.username,
                    password: usuarioData.password,
                    role: usuarioData.role
                });
                
                // Atribuir setores
                const setoresParaAtribuir = setores.filter(s => 
                    usuarioData.setores.includes(s.nome)
                );
                
                if (setoresParaAtribuir.length > 0) {
                    await user.addSetores(setoresParaAtribuir);
                }
                
                console.log(`   ✅ Usuário criado: ${user.username} (Setores: ${usuarioData.setores.join(', ')})`);
                
            } catch (error) {
                console.error(`   ❌ Erro ao criar usuário ${usuarioData.username}:`, error.message);
            }
        }
        
        // 2. Verificar usuários criados
        console.log('\n2️⃣ Verificando usuários criados...');
        
        const users = await User.findAll({
            include: [{
                model: Setor,
                as: 'setores',
                attributes: ['id', 'nome'],
                through: { attributes: [] }
            }]
        });
        
        console.log(`📊 Total de usuários: ${users.length}`);
        users.forEach(user => {
            const setores = user.setores.map(s => s.nome).join(', ') || 'Sem setores';
            console.log(`   - ${user.username} (${user.role}): ${setores}`);
        });
        
        console.log('\n✅ Usuários de teste criados com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro durante criação:', error);
        console.error('Stack trace:', error.stack);
    } finally {
        await require('../models').sequelize.close();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    criarUsuariosTeste();
}

module.exports = criarUsuariosTeste;
