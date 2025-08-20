#!/usr/bin/env node

require('dotenv').config();
const { User } = require('../models');

async function fixAdminUser() {
    try {
        console.log('🔧 Corrigindo usuário admin...');
        
        // Buscar o usuário admin
        const adminUser = await User.findOne({ where: { username: 'admin' } });
        
        if (adminUser) {
            console.log('✅ Usuário admin encontrado');
            
            // Verificar se já tem email
            if (!adminUser.email) {
                console.log('📝 Adicionando email ao usuário admin...');
                adminUser.email = 'admin@sistema.local';
                await adminUser.save();
                console.log('✅ Email adicionado com sucesso!');
            } else {
                console.log('✅ Usuário admin já tem email:', adminUser.email);
            }
        } else {
            console.log('📝 Criando usuário admin...');
            await User.create({
                username: 'admin',
                password: 'admin123',
                role: 'admin',
                email: 'admin@sistema.local'
            });
            console.log('✅ Usuário admin criado com sucesso!');
        }
        
        console.log('🎉 Usuário admin configurado!');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        process.exit(1);
    } finally {
        await User.sequelize.close();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    fixAdminUser();
}

module.exports = fixAdminUser;

