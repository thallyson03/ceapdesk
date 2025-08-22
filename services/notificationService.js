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
     * Buscar usuários que podem atender tickets de um setor específico
     * Inclui usuários que têm o setor como um de seus múltiplos setores
     */
    async getUsersForTicketAssignment(setorNome) {
        try {
            const users = await User.findAll({
                attributes: ['id', 'username', 'email', 'role'],
                include: [{
                    model: Setor,
                    as: 'setores',
                    where: { nome: setorNome },
                    attributes: ['id', 'nome'],
                    through: { attributes: [] }
                }],
                where: {
                    role: {
                        [require('sequelize').Op.in]: ['user', 'admin']
                    }
                }
            });

            return users;
        } catch (error) {
            console.error('❌ Erro ao buscar usuários para atribuição de ticket:', error);
            throw error;
        }
    }

    /**
     * Buscar o melhor usuário para atribuir um ticket baseado em carga de trabalho
     */
    async getBestUserForTicket(setorNome) {
        try {
            const { Ticket } = require('../models');
            
            // Buscar usuários do setor
            const users = await this.getUsersForTicketAssignment(setorNome);
            
            if (!users || users.length === 0) {
                return null;
            }

            // Se há apenas um usuário, retornar ele
            if (users.length === 1) {
                return users[0];
            }

            // Buscar carga de trabalho de cada usuário (tickets em aberto)
            const usersWithWorkload = await Promise.all(
                users.map(async (user) => {
                    const openTickets = await Ticket.count({
                        where: {
                            responsavel: user.username,
                            status: {
                                [require('sequelize').Op.in]: ['aberto', 'em_andamento']
                            }
                        }
                    });

                    return {
                        ...user.toJSON(),
                        workload: openTickets
                    };
                })
            );

            // Ordenar por carga de trabalho (menor primeiro) e retornar o primeiro
            usersWithWorkload.sort((a, b) => a.workload - b.workload);
            
            return usersWithWorkload[0];
        } catch (error) {
            console.error('❌ Erro ao buscar melhor usuário para ticket:', error);
            throw error;
        }
    }

    /**
     * Notificar usuários sobre novo ticket
     */
    async notifyNewTicket(ticket, setorNome) {
        try {
            // Iniciando notificação
            
            // Buscar usuários do setor
            const users = await this.getUsersBySetor(setorNome);
            
            if (!users || users.length === 0) {
                // Nenhum usuário encontrado para o setor
                return {
                    success: false,
                    message: 'Nenhum usuário encontrado para o setor',
                    usersNotified: 0
                };
            }

            // Filtrar usuários com email válido
            const usersWithEmail = users.filter(user => user.email);
            
            if (usersWithEmail.length === 0) {
                // Nenhum usuário com email válido encontrado
                return {
                    success: false,
                    message: 'Nenhum usuário com email válido encontrado',
                    usersNotified: 0
                };
            }

            // Enviar notificação por email
            await emailService.sendTicketNotification(ticket, usersWithEmail, setorNome);

            // Notificação enviada com sucesso

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


}

module.exports = new NotificationService();
