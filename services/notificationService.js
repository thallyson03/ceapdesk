const { User, Setor, UserSetor } = require('../models');
const emailService = require('./emailService');

class NotificationService {
    /**
     * Buscar usuários de um setor específico
     */
    async getUsersBySetor(setorNome) {
        try {
            const users = await User.findAll({
                attributes: ['id', 'username', 'email'],
                include: [{
                    model: Setor,
                    as: 'setores',
                    where: { nome: setorNome },
                    attributes: ['id', 'nome'],
                    through: { attributes: [] }
                }]
            });

            return users;
        } catch (error) {
            console.error('❌ Erro ao buscar usuários do setor:', error);
            throw error;
        }
    }

    /**
     * Notificar usuários sobre novo ticket
     */
    async notifyNewTicket(ticket, setorNome) {
        try {
            console.log(`🔔 Iniciando notificação para setor: ${setorNome}`);
            
            // Buscar usuários do setor
            const users = await this.getUsersBySetor(setorNome);
            
            if (!users || users.length === 0) {
                console.log(`⚠️ Nenhum usuário encontrado para o setor: ${setorNome}`);
                return {
                    success: false,
                    message: 'Nenhum usuário encontrado para o setor',
                    usersNotified: 0
                };
            }

            // Filtrar usuários com email válido
            const usersWithEmail = users.filter(user => user.email);
            
            if (usersWithEmail.length === 0) {
                console.log(`⚠️ Nenhum usuário com email válido encontrado para o setor: ${setorNome}`);
                return {
                    success: false,
                    message: 'Nenhum usuário com email válido encontrado',
                    usersNotified: 0
                };
            }

            // Enviar notificação por email
            await emailService.sendTicketNotification(ticket, usersWithEmail, setorNome);

            console.log(`✅ Notificação enviada com sucesso para ${usersWithEmail.length} usuários do setor ${setorNome}`);

            return {
                success: true,
                message: 'Notificação enviada com sucesso',
                usersNotified: usersWithEmail.length,
                users: usersWithEmail.map(user => ({
                    id: user.id,
                    username: user.username,
                    email: user.email
                }))
            };

        } catch (error) {
            console.error('❌ Erro ao enviar notificação:', error);
            throw error;
        }
    }

    /**
     * Verificar se o serviço de email está configurado
     */
    async checkEmailServiceStatus() {
        try {
            const hasApiKey = !!process.env.RESEND_API_KEY;
            const hasFromEmail = !!process.env.FROM_EMAIL;
            
            return {
                configured: hasApiKey && hasFromEmail,
                hasApiKey,
                hasFromEmail,
                fromEmail: process.env.FROM_EMAIL || 'não configurado',
                fromName: process.env.FROM_NAME || 'Sistema de Tickets'
            };
        } catch (error) {
            console.error('❌ Erro ao verificar status do serviço de email:', error);
            return {
                configured: false,
                error: error.message
            };
        }
    }

    /**
     * Testar serviço de notificação
     */
    async testNotification() {
        try {
            const status = await this.checkEmailServiceStatus();
            
            if (!status.configured) {
                return {
                    success: false,
                    message: 'Serviço de email não configurado',
                    status
                };
            }

            // Testar conexão com Resend
            const connectionTest = await emailService.testConnection();
            
            return {
                success: connectionTest,
                message: connectionTest ? 'Teste realizado com sucesso' : 'Falha no teste de conexão',
                status
            };

        } catch (error) {
            console.error('❌ Erro no teste de notificação:', error);
            return {
                success: false,
                message: 'Erro no teste de notificação',
                error: error.message
            };
        }
    }
}

module.exports = new NotificationService();
