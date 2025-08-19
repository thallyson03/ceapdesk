const notificationService = require('../services/notificationService');

async function testEmailNotification() {
    console.log('🧪 Testando funcionalidade de notificação por email...\n');
    
    try {
        // 1. Verificar status do serviço
        console.log('1️⃣ Verificando status do serviço de email...');
        const status = await notificationService.checkEmailServiceStatus();
        console.log('Status:', JSON.stringify(status, null, 2));
        
        if (!status.configured) {
            console.log('\n⚠️ Serviço de email não configurado!');
            console.log('Para configurar:');
            console.log('1. Crie uma conta em https://resend.com');
            console.log('2. Obtenha sua API key');
            console.log('3. Adicione ao .env:');
            console.log('   RESEND_API_KEY=re_sua_chave_aqui');
            console.log('   FROM_EMAIL=seu-email@dominio.com');
            console.log('   FROM_NAME=Sistema de Tickets');
            return;
        }
        
        // 2. Testar conexão
        console.log('\n2️⃣ Testando conexão com Resend...');
        const testResult = await notificationService.testNotification();
        console.log('Resultado do teste:', JSON.stringify(testResult, null, 2));
        
        // 3. Simular notificação de ticket
        console.log('\n3️⃣ Simulando notificação de ticket...');
        const mockTicket = {
            id: 1234,
            titulo: 'Teste de Notificação',
            descricao: 'Este é um teste da funcionalidade de notificação por email.',
            prioridade: 'media',
            solicitante: 'admin',
            createdAt: new Date()
        };
        
        const mockUsers = [
            {
                id: 1,
                username: 'usuario1',
                email: 'teste1@exemplo.com'
            },
            {
                id: 2,
                username: 'usuario2',
                email: 'teste2@exemplo.com'
            }
        ];
        
        console.log('Ticket simulado:', JSON.stringify(mockTicket, null, 2));
        console.log('Usuários simulados:', JSON.stringify(mockUsers, null, 2));
        
        // 4. Testar template de email
        console.log('\n4️⃣ Testando template de email...');
        const emailService = require('../services/emailService');
        const template = emailService.createTicketNotificationTemplate(mockTicket, 'TI');
        console.log('Template gerado com sucesso!');
        console.log('Tamanho do template:', template.length, 'caracteres');
        
        console.log('\n✅ Teste concluído com sucesso!');
        console.log('\n📋 Próximos passos:');
        console.log('1. Configure as variáveis de email no .env');
        console.log('2. Execute a migração: node scripts/add-email-field.js');
        console.log('3. Teste criando um ticket real no sistema');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    testEmailNotification()
        .then(() => {
            console.log('\n🎯 Teste finalizado!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Erro fatal:', error);
            process.exit(1);
        });
}

module.exports = testEmailNotification;
