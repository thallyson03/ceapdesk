const { Resend } = require('resend');
const config = require('../config');

// Inicializar Resend
const resend = new Resend(process.env.RESEND_API_KEY);

class EmailService {
    constructor() {
        this.fromEmail = process.env.FROM_EMAIL || 'noreply@sistema-tickets.com';
        this.fromName = process.env.FROM_NAME || 'Sistema de Tickets';
    }

    /**
     * Enviar notificação de novo ticket
     */
    async sendTicketNotification(ticket, users, setor) {
        try {
            if (!users || users.length === 0) {
                // Nenhum usuário encontrado para o setor
                return;
            }

            const emails = users.map(user => user.email).filter(email => email);
            
            if (emails.length === 0) {
                // Nenhum email válido encontrado
                return;
            }

            const emailContent = this.createTicketNotificationTemplate(ticket, setor);
            
            const result = await resend.emails.send({
                from: `${this.fromName} <${this.fromEmail}>`,
                to: emails,
                subject: `🎫 Novo Ticket Criado - Setor: ${setor}`,
                html: emailContent
            });

            // Notificação enviada silenciosamente
            
            return result;
        } catch (error) {
            console.error('❌ Erro ao enviar notificação por email:', error);
            throw error;
        }
    }

    /**
     * Criar template HTML para notificação de ticket
     */
    createTicketNotificationTemplate(ticket, setor) {
        const priorityColors = {
            'baixa': '#28a745',
            'media': '#ffc107',
            'alta': '#dc3545'
        };

        const priorityColor = priorityColors[ticket.prioridade] || '#6c757d';
        const formattedDate = new Date(ticket.createdAt).toLocaleString('pt-BR');

        return `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Novo Ticket Criado</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f8f9fa;
                }
                .container {
                    background-color: #ffffff;
                    border-radius: 8px;
                    padding: 30px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .header {
                    text-align: center;
                    border-bottom: 3px solid #007bff;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .header h1 {
                    color: #007bff;
                    margin: 0;
                    font-size: 24px;
                }
                .ticket-info {
                    background-color: #f8f9fa;
                    border-radius: 6px;
                    padding: 20px;
                    margin: 20px 0;
                }
                .ticket-field {
                    margin-bottom: 15px;
                }
                .ticket-field strong {
                    color: #495057;
                    display: inline-block;
                    width: 120px;
                }
                .priority-badge {
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 20px;
                    color: white;
                    font-weight: bold;
                    text-transform: uppercase;
                    font-size: 12px;
                }
                .ticket-id {
                    background-color: #007bff;
                    color: white;
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-weight: bold;
                    display: inline-block;
                    margin-bottom: 10px;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #dee2e6;
                    color: #6c757d;
                    font-size: 14px;
                }
                .btn {
                    display: inline-block;
                    background-color: #007bff;
                    color: white;
                    padding: 12px 24px;
                    text-decoration: none;
                    border-radius: 6px;
                    margin-top: 20px;
                    font-weight: bold;
                }
                .btn:hover {
                    background-color: #0056b3;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎫 Novo Ticket Criado</h1>
                    <p>Um novo ticket foi criado no seu setor</p>
                </div>

                <div class="ticket-info">
                    <div class="ticket-id">
                        Ticket #${String(ticket.id).padStart(4, '0')}
                    </div>
                    
                    <div class="ticket-field">
                        <strong>Título:</strong> ${ticket.titulo}
                    </div>
                    
                    <div class="ticket-field">
                        <strong>Setor:</strong> ${setor}
                    </div>
                    
                    <div class="ticket-field">
                        <strong>Prioridade:</strong> 
                        <span class="priority-badge" style="background-color: ${priorityColor}">
                            ${ticket.prioridade}
                        </span>
                    </div>
                    
                    <div class="ticket-field">
                        <strong>Solicitante:</strong> ${ticket.solicitante}
                    </div>
                    
                    <div class="ticket-field">
                        <strong>Data:</strong> ${formattedDate}
                    </div>
                    
                    <div class="ticket-field">
                        <strong>Descrição:</strong><br>
                        <div style="margin-top: 8px; padding: 10px; background-color: white; border-radius: 4px; border-left: 4px solid #007bff;">
                            ${ticket.descricao.replace(/\n/g, '<br>')}
                        </div>
                    </div>
                </div>

                <div style="text-align: center;">
                    <a href="${process.env.SYSTEM_URL || 'http://localhost:3000'}/dashboard.html" class="btn">
                        📋 Acessar Sistema
                    </a>
                </div>

                <div class="footer">
                    <p>Esta notificação foi enviada automaticamente pelo Sistema de Tickets</p>
                    <p>Se você não deveria receber este email, entre em contato com o administrador</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }


}

module.exports = new EmailService();
