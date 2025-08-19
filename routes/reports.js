const express = require('express');
const router = express.Router();
const { Ticket, User, Setor, sequelize } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { Op } = require('sequelize');
const XLSX = require('xlsx');

router.use(authMiddleware);

// Rota para download de relatório de tickets em CSV (alternativa ao Excel)
router.get('/tickets', async (req, res) => {
    try {
        // Verificar se o usuário é admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem baixar relatórios.' });
        }

        const { startDate, endDate, status, setor } = req.query;
        let whereCondition = {};

        // Aplicar filtros
        if (startDate && endDate) {
            whereCondition.createdAt = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        } else if (startDate) {
            whereCondition.createdAt = {
                [Op.gte]: new Date(startDate)
            };
        } else if (endDate) {
            whereCondition.createdAt = {
                [Op.lte]: new Date(endDate)
            };
        }

        if (status && status !== 'todos') {
            whereCondition.status = status;
        }

        if (setor && setor !== 'todos') {
            whereCondition.setor = setor;
        }

        const tickets = await Ticket.findAll({
            where: whereCondition,
            attributes: [
                'id',
                'titulo',
                'descricao',
                'status',
                'prioridade',
                'responsavel',
                'solicitante',
                'setor',
                'createdAt',
                'dataLimiteSLA',
                'statusSLA',
                'diasSLA'
            ],
            order: [['createdAt', 'DESC']]
        });

        // Preparar dados para o Excel
        const excelData = [
            ['Número do Ticket', 'Título', 'Status', 'Prioridade', 'Setor', 'Responsável', 'Criado por', 'Data de Criação', 'Data Limite SLA', 'Status SLA', 'Dias SLA']
        ];
        
        tickets.forEach(ticket => {
            excelData.push([
                `#${ticket.id}`,
                ticket.titulo || 'Sem título',
                ticket.status,
                ticket.prioridade || 'Não definida',
                ticket.setor || 'Não atribuído',
                ticket.responsavel || 'Não atribuído',
                ticket.solicitante || 'Não informado',
                new Date(ticket.createdAt).toLocaleDateString('pt-BR'),
                ticket.dataLimiteSLA ? new Date(ticket.dataLimiteSLA).toLocaleDateString('pt-BR') : 'Não definido',
                ticket.statusSLA || 'Não definido',
                ticket.diasSLA || 'Não definido'
            ]);
        });

        // Criar workbook e worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(excelData);

        // Aplicar estilos ao cabeçalho
        worksheet['!cols'] = [
            { width: 15 }, // Número do Ticket
            { width: 30 }, // Título
            { width: 12 }, // Status
            { width: 12 }, // Prioridade
            { width: 20 }, // Setor
            { width: 20 }, // Responsável
            { width: 20 }, // Criado por
            { width: 15 }, // Data de Criação
            { width: 15 }, // Data Limite SLA
            { width: 15 }, // Status SLA
            { width: 12 }  // Dias SLA
        ];

        // Adicionar worksheet ao workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório de Tickets');

        // Gerar buffer do arquivo Excel
        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // Configurar headers para download
        const filename = `relatorio_tickets_${new Date().toISOString().split('T')[0]}.xlsx`;
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', excelBuffer.length);
        
        res.send(excelBuffer);

    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Rota para download de relatório de produtividade
router.get('/productivity', async (req, res) => {
    try {
        // Verificar se o usuário é admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem baixar relatórios.' });
        }

        const { startDate, endDate } = req.query;
        let whereCondition = {};

        if (startDate && endDate) {
            whereCondition.createdAt = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        } else if (startDate) {
            whereCondition.createdAt = {
                [Op.gte]: new Date(startDate)
            };
        } else if (endDate) {
            whereCondition.createdAt = {
                [Op.lte]: new Date(endDate)
            };
        }

        // Buscar todos os usuários com setores
        const users = await User.findAll({
            attributes: ['id', 'username', 'role'],
            include: [{
                model: Setor,
                as: 'setores',
                attributes: ['nome'],
                through: { attributes: [] }
            }]
        });

        // Buscar tickets fechados por usuário
        const ticketsFechados = await Ticket.findAll({
            where: {
                ...whereCondition,
                status: 'fechado'
            },
            attributes: ['id', 'titulo', 'responsavel', 'setor', 'createdAt', 'updatedAt', 'prioridade']
        });

        // Calcular produtividade por usuário
        const produtividade = users.map(user => {
            const ticketsDoUsuario = ticketsFechados.filter(ticket => 
                ticket.responsavel === user.username
            );

            const tempoMedioResolucao = ticketsDoUsuario.length > 0 
                ? ticketsDoUsuario.reduce((total, ticket) => {
                    const criacao = new Date(ticket.createdAt);
                    const encerramento = new Date(ticket.updatedAt);
                    return total + (encerramento - criacao);
                }, 0) / ticketsDoUsuario.length / (1000 * 60 * 60 * 24) // Converter para dias
                : 0;

            // Calcular tickets por prioridade
            const alta = ticketsDoUsuario.filter(t => t.prioridade === 'alta').length;
            const media = ticketsDoUsuario.filter(t => t.prioridade === 'media').length;
            const baixa = ticketsDoUsuario.filter(t => t.prioridade === 'baixa').length;

            return {
                username: user.username,
                setor: user.setores.length > 0 ? user.setores[0].nome : 'Sem setor',
                role: user.role,
                ticketsFechados: ticketsDoUsuario.length,
                ticketsAlta: alta,
                ticketsMedia: media,
                ticketsBaixa: baixa,
                tempoMedioResolucao: Math.round(tempoMedioResolucao * 100) / 100
            };
        });

        // Preparar dados para o Excel
        const excelData = [
            ['Usuário', 'Setor', 'Função', 'Total Tickets Fechados', 'Tickets Alta Prioridade', 'Tickets Média Prioridade', 'Tickets Baixa Prioridade', 'Tempo Médio de Resolução (dias)']
        ];
        
        produtividade.forEach(user => {
            excelData.push([
                user.username,
                user.setor,
                user.role,
                user.ticketsFechados,
                user.ticketsAlta,
                user.ticketsMedia,
                user.ticketsBaixa,
                user.tempoMedioResolucao
            ]);
        });

        // Criar workbook e worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(excelData);

        // Aplicar estilos ao cabeçalho
        worksheet['!cols'] = [
            { width: 20 }, // Usuário
            { width: 20 }, // Setor
            { width: 15 }, // Função
            { width: 20 }, // Total Tickets Fechados
            { width: 20 }, // Tickets Alta Prioridade
            { width: 20 }, // Tickets Média Prioridade
            { width: 20 }, // Tickets Baixa Prioridade
            { width: 25 }  // Tempo Médio de Resolução
        ];

        // Adicionar worksheet ao workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório de Produtividade');

        // Gerar buffer do arquivo Excel
        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // Configurar headers para download
        const filename = `relatorio_produtividade_${new Date().toISOString().split('T')[0]}.xlsx`;
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', excelBuffer.length);
        
        res.send(excelBuffer);

    } catch (error) {
        console.error('Erro ao gerar relatório de produtividade:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Rota para obter dados de relatório (para visualização na página)
router.get('/data', async (req, res) => {
    try {
        // Verificar se o usuário é admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem acessar relatórios.' });
        }

        const { startDate, endDate, status, setor, page = 1, limit = 50 } = req.query;
        let whereCondition = {};

        // Aplicar filtros
        if (startDate && endDate) {
            whereCondition.createdAt = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        } else if (startDate) {
            whereCondition.createdAt = {
                [Op.gte]: new Date(startDate)
            };
        } else if (endDate) {
            whereCondition.createdAt = {
                [Op.lte]: new Date(endDate)
            };
        }

        if (status && status !== 'todos') {
            whereCondition.status = status;
        }

        if (setor && setor !== 'todos') {
            whereCondition.areaResponsavel = setor;
        }

        // Calcular offset para paginação
        const offset = (page - 1) * limit;

        const { count, rows: tickets } = await Ticket.findAndCountAll({
            where: whereCondition,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        // Formatar dados para o relatório
        const formattedTickets = tickets.map(ticket => ({
            id: ticket.id,
            status: ticket.status,
            setor: ticket.areaResponsavel || 'Não atribuído',
            responsavel: ticket.responsavel || 'Não atribuído',
            criadoPor: ticket.solicitante || 'Não informado',
            dataCriacao: new Date(ticket.createdAt).toLocaleDateString('pt-BR'),
            dataLimite: ticket.dataLimiteSLA ? new Date(ticket.dataLimiteSLA).toLocaleDateString('pt-BR') : 'Não definido',
            statusSLA: ticket.statusSLA || 'Não definido'
        }));

        res.json({
            tickets: formattedTickets,
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit)
        });

    } catch (error) {
        console.error('Erro ao buscar dados do relatório:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Rota para obter estatísticas do relatório
router.get('/stats', async (req, res) => {
    try {
        // Verificar se o usuário é admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem acessar relatórios.' });
        }

        const { startDate, endDate, status, setor } = req.query;
        let whereCondition = {};

        // Aplicar filtros
        if (startDate && endDate) {
            whereCondition.createdAt = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        } else if (startDate) {
            whereCondition.createdAt = {
                [Op.gte]: new Date(startDate)
            };
        } else if (endDate) {
            whereCondition.createdAt = {
                [Op.lte]: new Date(endDate)
            };
        }

        if (status && status !== 'todos') {
            whereCondition.status = status;
        }

        if (setor && setor !== 'todos') {
            whereCondition.areaResponsavel = setor;
        }

        // Buscar todos os tickets
        const allTickets = await Ticket.findAll({ where: whereCondition });

        // Calcular estatísticas manualmente
        const statusCount = {};
        const setorCount = {};
        const slaCount = {};

        allTickets.forEach(ticket => {
            // Status
            statusCount[ticket.status] = (statusCount[ticket.status] || 0) + 1;
            
            // Setor
            const setor = ticket.areaResponsavel || 'Não atribuído';
            setorCount[setor] = (setorCount[setor] || 0) + 1;
            
            // SLA
            const sla = ticket.statusSLA || 'Não definido';
            slaCount[sla] = (slaCount[sla] || 0) + 1;
        });

        const statusStats = Object.entries(statusCount).map(([status, count]) => ({
            status,
            count
        }));

        const setorStats = Object.entries(setorCount).map(([setor, count]) => ({
            setor,
            count
        }));

        const slaStats = Object.entries(slaCount).map(([statusSLA, count]) => ({
            statusSLA,
            count
        }));

        res.json({
            totalTickets: allTickets.length,
            statusStats,
            setorStats,
            slaStats
        });

    } catch (error) {
        console.error('Erro ao buscar estatísticas do relatório:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

module.exports = router;
