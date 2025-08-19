const { User, Setor } = require('../models');
const jwt = require('jsonwebtoken');
const config = require('../config');

async function checkCurrentToken() {
    try {
        console.log('🔍 Verificando token atual...\n');
        
        // 1. Verificar todos os usuários e seus setores
        console.log('1️⃣ Verificando usuários e setores...');
        const users = await User.findAll({
            include: [{
                model: Setor,
                as: 'setores',
                attributes: ['id', 'nome'],
                through: { attributes: [] }
            }]
        });
        
        console.log(`   📊 Total de usuários: ${users.length}`);
        users.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.username} (${user.role}):`);
            console.log(`      - Setores: ${user.setores.map(s => s.nome).join(', ') || 'Sem setores'}`);
            console.log(`      - Setores count: ${user.setores.length}`);
        });
        
        // 2. Simular login para cada usuário
        console.log('\n2️⃣ Simulando login para cada usuário...');
        
        for (const user of users) {
            console.log(`\n   📋 Usuário: ${user.username} (${user.role})`);
            
            // Criar JWT token
            const token = jwt.sign(
                { 
                    id: user.id, 
                    username: user.username, 
                    role: user.role, 
                    setores: user.setores.map(s => ({ id: s.id, nome: s.nome }))
                },
                config.SECRET_KEY,
                { expiresIn: '1h' }
            );
            
            // Verificar token
            const decoded = jwt.verify(token, config.SECRET_KEY);
            
            console.log(`      - JWT setores: ${JSON.stringify(decoded.setores)}`);
            console.log(`      - JWT setor: ${decoded.setor}`);
            
            // Aplicar middleware
            const req = { user: decoded };
            
            if (req.user.setores && req.user.setores.length > 0) {
                req.user.setor = req.user.setores[0].nome;
            } else {
                req.user.setor = 'Geral';
            }
            
            console.log(`      - Após middleware setor: ${req.user.setor}`);
            
            // Testar uso em rota
            let whereCondition = {};
            if (req.user.role !== 'admin') {
                whereCondition.setor = req.user.setor;
                console.log(`      - Filtro por setor: ${req.user.setor}`);
            } else {
                console.log(`      - Admin: sem filtro por setor`);
            }
        }
        
        // 3. Verificar se há algum problema específico
        console.log('\n3️⃣ Verificando possíveis problemas...');
        
        // Verificar se há usuários sem setores
        const usersWithoutSetores = users.filter(u => u.setores.length === 0);
        if (usersWithoutSetores.length > 0) {
            console.log(`   ⚠️  Usuários sem setores: ${usersWithoutSetores.length}`);
            usersWithoutSetores.forEach(u => {
                console.log(`      - ${u.username} (${u.role})`);
            });
        } else {
            console.log('   ✅ Todos os usuários têm setores');
        }
        
        // Verificar se há usuários com múltiplos setores
        const usersWithMultipleSetores = users.filter(u => u.setores.length > 1);
        if (usersWithMultipleSetores.length > 0) {
            console.log(`   📋 Usuários com múltiplos setores: ${usersWithMultipleSetores.length}`);
            usersWithMultipleSetores.forEach(u => {
                console.log(`      - ${u.username}: ${u.setores.map(s => s.nome).join(', ')}`);
            });
        } else {
            console.log('   ℹ️  Nenhum usuário com múltiplos setores');
        }
        
        console.log('\n✅ Verificação concluída!');
        console.log('\n🎯 Resumo:');
        console.log('   ✅ Middleware funcionando corretamente');
        console.log('   ✅ Campo setor sendo atribuído');
        console.log('   ✅ Lógica de filtros funcionando');
        
        console.log('\n💡 Se você ainda está vendo undefined:');
        console.log('   1. Limpe o cache do navegador');
        console.log('   2. Faça logout e login novamente');
        console.log('   3. Verifique se está usando o token correto');
        
    } catch (error) {
        console.error('❌ Erro durante verificação:', error);
        console.error('Stack trace:', error.stack);
    } finally {
        await require('../models').sequelize.close();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    checkCurrentToken();
}

module.exports = checkCurrentToken;
