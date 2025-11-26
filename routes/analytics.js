const express = require('express');
const router = express.Router();
const { Ticket, User, Setor, Assunto, SLA, sequelize } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { Op } = require('sequelize');

// Middleware para garantir que apenas admins possam acessar as rotas de analytics
router.use(authMiddleware);
router.use((req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem visualizar a produtividade.' });
    }
    next();
});

// Rota para obter dados de produtividade com filtros
router.get('/productivity', async (req, res) => {
    try {
        const { usuario, startDate, endDate } = req.query;
        
        let whereClause = {
            status: 'fechado'
        };

        if (usuario && usuario !== 'todos') {
            whereClause.responsavel = usuario;
        }

        if (startDate && endDate) {
            whereClause.createdAt = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        } else if (startDate) {
            whereClause.createdAt = {
                [Op.gte]: new Date(startDate)
            };
        } else if (endDate) {
            whereClause.createdAt = {
                [Op.lte]: new Date(endDate)
            };
        }

        // Buscar todos os usuários primeiro para garantir que tenhamos uma lista completa
        const allUsers = await User.findAll({
            attributes: ['username', 'role'],
            include: [{
                model: Setor,
                as: 'setores',
                attributes: ['nome'],
                through: { attributes: [] }
            }]
        });

        // Buscar tickets fechados
        const tickets = await Ticket.findAll({
            where: whereClause,
            attributes: [
                'responsavel',
                [sequelize.fn('COUNT', sequelize.col('id')), 'totalFechado']
            ],
            group: ['responsavel'],
            order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
        });
        
        // Criar um mapa dos tickets por usuário
        const ticketsPorUsuario = {};
        tickets.forEach(item => {
            // Ignorar tickets com responsavel null
            if (item.responsavel) {
                ticketsPorUsuario[item.responsavel] = parseInt(item.dataValues.totalFechado);
            }
        });

        // Criar dados de produtividade para todos os usuários
        const productivityData = allUsers.map(user => ({
            usuarioResponsavel: user.username,
            setor: user.setores.length > 0 ? user.setores[0].nome : 'Sem setor',
            role: user.role,
            totalFechado: ticketsPorUsuario[user.username] || 0
        }));

        // Filtrar dados baseado no filtro de usuário
        const finalData = (usuario && usuario !== 'todos') 
            ? productivityData.filter(item => item.usuarioResponsavel === usuario)
            : productivityData; // Mostrar todos os usuários quando "todos" estiver selecionado
        
        res.status(200).json(finalData);
    } catch (error) {
        console.error('Erro ao buscar dados de produtividade:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Rota para obter estatísticas gerais do sistema
router.get('/stats', async (req, res) => {
    try {
        // Buscar total de tickets abertos
        const ticketsAbertos = await Ticket.count({
            where: { status: 'aberto' }
        });

        // Buscar total de tickets fechados
        const ticketsFechados = await Ticket.count({
            where: { status: 'fechado' }
        });

        // Buscar total de usuários ativos
        const usuariosAtivos = await User.count({
            where: { role: { [Op.ne]: 'admin' } }
        });

        // Calcular taxa de resolução
        const totalTickets = ticketsAbertos + ticketsFechados;
        const taxaResolucao = totalTickets > 0 ? Math.round((ticketsFechados / totalTickets) * 100) : 0;

        res.status(200).json({
            ticketsAbertos,
            ticketsFechados,
            usuariosAtivos,
            taxaResolucao
        });
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Rota para obter todos os usuários (necessária para popular o filtro no frontend)
router.get('/users', async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['username']
        });
        res.status(200).json(users.map(user => user.username));
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Rota para obter todos os setores (necessária para popular o filtro no frontend)
router.get('/setores', async (req, res) => {
    try {
        const setores = await Setor.findAll({
            attributes: ['nome']
        });
        res.status(200).json(setores.map(setor => setor.nome));
    } catch (error) {
        console.error('Erro ao buscar setores:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// NOVA ROTA: Dashboard completo com dados para gráficos
router.get('/dashboard-completo', async (req, res) => {
    try {
        const { periodo = '30', setor, usuario } = req.query; // dias, setor, usuario

        // Se periodo = 'all', não filtra por data (usa todo o histórico)
        let dataInicio = null;
        if (periodo !== 'all') {
            const dias = parseInt(periodo, 10);
            if (!isNaN(dias) && dias > 0) {
                dataInicio = new Date();
                dataInicio.setDate(dataInicio.getDate() - dias);
            }
        }

        // Construir condições de filtro
        const whereConditions = {};
        if (dataInicio) {
            whereConditions.createdAt = { [Op.gte]: dataInicio };
        }

        if (setor && setor !== '') {
            whereConditions.setor = setor;
        }

        if (usuario && usuario !== '') {
            whereConditions.responsavel = usuario;
        }

        // 1. Distribuição de tickets por status
        const ticketsPorStatus = await Ticket.findAll({
            attributes: [
                'status',
                [sequelize.fn('COUNT', sequelize.col('Ticket.id')), 'total']
            ],
            group: ['status'],
            where: whereConditions
        });

        // 2. Distribuição de tickets por prioridade
        const ticketsPorPrioridade = await Ticket.findAll({
            attributes: [
                'prioridade',
                [sequelize.fn('COUNT', sequelize.col('Ticket.id')), 'total']
            ],
            group: ['prioridade'],
            where: whereConditions
        });

        // 3. Distribuição de tickets por setor
        const ticketsPorSetor = await Ticket.findAll({
            attributes: [
                'setor',
                [sequelize.fn('COUNT', sequelize.col('Ticket.id')), 'total']
            ],
            group: ['setor'],
            where: whereConditions
        });

        // 4. Performance de SLA
        const slaStats = await Ticket.findAll({
            attributes: [
                'statusSLA',
                [sequelize.fn('COUNT', sequelize.col('Ticket.id')), 'total']
            ],
            group: ['statusSLA'],
            where: whereConditions
        });

        // 5. Tendência temporal (últimos 7 dias)
        const tendenciaTemporal = [];
        for (let i = 6; i >= 0; i--) {
            const data = new Date();
            data.setDate(data.getDate() - i);
            const dataInicioDia = new Date(data.setHours(0, 0, 0, 0));
            const dataFimDia = new Date(data.setHours(23, 59, 59, 999));

            // Condições para tickets criados
            const whereCriados = {
                createdAt: { [Op.between]: [dataInicioDia, dataFimDia] }
            };
            if (setor && setor !== '') whereCriados.setor = setor;
            if (usuario && usuario !== '') whereCriados.responsavel = usuario;

            // Condições para tickets resolvidos
            const whereResolvidos = {
                updatedAt: { [Op.between]: [dataInicioDia, dataFimDia] },
                status: 'fechado'
            };
            if (setor && setor !== '') whereResolvidos.setor = setor;
            if (usuario && usuario !== '') whereResolvidos.responsavel = usuario;

            const ticketsCriados = await Ticket.count({ where: whereCriados });
            const ticketsResolvidos = await Ticket.count({ where: whereResolvidos });

            tendenciaTemporal.push({
                data: dataInicioDia.toISOString().split('T')[0],
                criados: ticketsCriados,
                resolvidos: ticketsResolvidos
            });
        }

        // 6. Top assuntos por setor
        const whereAssuntos = {
            assuntoId: { [Op.ne]: null }
        };
        if (dataInicio) {
            whereAssuntos.createdAt = { [Op.gte]: dataInicio };
        }
        if (setor && setor !== '') whereAssuntos.setor = setor;
        if (usuario && usuario !== '') whereAssuntos.responsavel = usuario;

        const assuntosPopulares = await Ticket.findAll({
            attributes: [
                'assuntoId',
                [sequelize.fn('COUNT', sequelize.col('Ticket.id')), 'total']
            ],
            include: [{
                model: Assunto,
                as: 'assunto',
                attributes: ['nome', 'descricao'],
                include: [{
                    model: Setor,
                    as: 'setor',
                    attributes: ['nome']
                }]
            }],
            group: ['assuntoId', 'assunto.id', 'assunto.nome', 'assunto.descricao', 'assunto->setor.id', 'assunto->setor.nome'],
            where: whereAssuntos,
            order: [[sequelize.fn('COUNT', sequelize.col('Ticket.id')), 'DESC']],
            limit: 10
        });

        res.status(200).json({
            ticketsPorStatus: ticketsPorStatus.map(item => ({
                status: item.status,
                total: parseInt(item.dataValues.total)
            })),
            ticketsPorPrioridade: ticketsPorPrioridade.map(item => ({
                prioridade: item.prioridade,
                total: parseInt(item.dataValues.total)
            })),
            ticketsPorSetor: ticketsPorSetor.map(item => ({
                setor: item.setor,
                total: parseInt(item.dataValues.total)
            })),
            slaStats: slaStats.map(item => ({
                statusSLA: item.statusSLA,
                total: parseInt(item.dataValues.total)
            })),
            tendenciaTemporal,
            assuntosPopulares: assuntosPopulares.map(item => ({
                nome: item.assunto?.nome || 'Sem assunto',
                setor: item.assunto?.setor?.nome || 'Sem setor',
                total: parseInt(item.dataValues.total)
            }))
        });
    } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// NOVA ROTA: Performance por setor
router.get('/performance-setores', async (req, res) => {
    try {
        const { periodo = '30', setor, usuario } = req.query;

        let dataInicio = null;
        if (periodo !== 'all') {
            const dias = parseInt(periodo, 10);
            if (!isNaN(dias) && dias > 0) {
                dataInicio = new Date();
                dataInicio.setDate(dataInicio.getDate() - dias);
            }
        }

        // Construir condições de filtro
        const whereConditions = {};
        if (dataInicio) {
            whereConditions.createdAt = { [Op.gte]: dataInicio };
        }

        if (setor && setor !== '') {
            whereConditions.setor = setor;
        }

        if (usuario && usuario !== '') {
            whereConditions.responsavel = usuario;
        }

        const performanceSetores = await Ticket.findAll({
            attributes: [
                'setor',
                [sequelize.fn('COUNT', sequelize.col('Ticket.id')), 'totalTickets'],
                [sequelize.fn('COUNT', sequelize.literal("CASE WHEN \"Ticket\".\"status\" = 'fechado' THEN 1 END")), 'ticketsResolvidos'],
                [sequelize.fn('AVG', sequelize.literal('EXTRACT(EPOCH FROM (\"Ticket\".\"updatedAt\" - \"Ticket\".\"createdAt\"))')), 'tempoMedioResolucao'],
                [sequelize.fn('COUNT', sequelize.literal("CASE WHEN \"Ticket\".\"statusSLA\" = 'dentro_prazo' THEN 1 END")), 'slaDentroPrazo'],
                [sequelize.fn('COUNT', sequelize.literal("CASE WHEN \"Ticket\".\"statusSLA\" = 'vencido' THEN 1 END")), 'slaVencido']
            ],
            group: ['setor'],
            where: whereConditions,
            order: [[sequelize.fn('COUNT', sequelize.col('Ticket.id')), 'DESC']]
        });

        const resultado = performanceSetores.map(item => {
            const total = parseInt(item.dataValues.totalTickets);
            const resolvidos = parseInt(item.dataValues.ticketsResolvidos);
            const slaDentroPrazo = parseInt(item.dataValues.slaDentroPrazo);
            const slaVencido = parseInt(item.dataValues.slaVencido);
            const tempoMedio = parseFloat(item.dataValues.tempoMedioResolucao) || 0;

            return {
                setor: item.setor,
                totalTickets: total,
                ticketsResolvidos: resolvidos,
                taxaResolucao: total > 0 ? Math.round((resolvidos / total) * 100) : 0,
                tempoMedioResolucao: Math.round(tempoMedio / 3600), // em horas
                slaCompliance: total > 0 ? Math.round((slaDentroPrazo / total) * 100) : 0,
                slaVencido: slaVencido
            };
        });

        res.status(200).json(resultado);
    } catch (error) {
        console.error('Erro ao buscar performance por setor:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// NOVA ROTA: Performance detalhada de usuários
router.get('/usuarios-performance', async (req, res) => {
    try {
        const { periodo = '30', setor, usuario } = req.query;

        let dataInicio = null;
        if (periodo !== 'all') {
            const dias = parseInt(periodo, 10);
            if (!isNaN(dias) && dias > 0) {
                dataInicio = new Date();
                dataInicio.setDate(dataInicio.getDate() - dias);
            }
        }

        // Construir condições de filtro
        const whereConditions = {
            responsavel: { [Op.ne]: null }
        };
        if (dataInicio) {
            whereConditions.createdAt = { [Op.gte]: dataInicio };
        }

        if (setor && setor !== '') {
            whereConditions.setor = setor;
        }

        if (usuario && usuario !== '') {
            whereConditions.responsavel = usuario;
        }

        const performanceUsuarios = await Ticket.findAll({
            attributes: [
                'responsavel',
                [sequelize.fn('COUNT', sequelize.col('Ticket.id')), 'totalTickets'],
                [sequelize.fn('COUNT', sequelize.literal("CASE WHEN \"Ticket\".\"status\" = 'fechado' THEN 1 END")), 'ticketsResolvidos'],
                [sequelize.fn('AVG', sequelize.literal('EXTRACT(EPOCH FROM (\"Ticket\".\"updatedAt\" - \"Ticket\".\"createdAt\"))')), 'tempoMedioResolucao'],
                [sequelize.fn('COUNT', sequelize.literal("CASE WHEN \"Ticket\".\"statusSLA\" = 'dentro_prazo' THEN 1 END")), 'slaDentroPrazo'],
                [sequelize.fn('COUNT', sequelize.literal("CASE WHEN \"Ticket\".\"statusSLA\" = 'vencido' THEN 1 END")), 'slaVencido']
            ],
            group: ['responsavel'],
            where: whereConditions,
            order: [[sequelize.fn('COUNT', sequelize.col('Ticket.id')), 'DESC']]
        });

        const resultado = performanceUsuarios.map(item => {
            const total = parseInt(item.dataValues.totalTickets);
            const resolvidos = parseInt(item.dataValues.ticketsResolvidos);
            const slaDentroPrazo = parseInt(item.dataValues.slaDentroPrazo);
            const slaVencido = parseInt(item.dataValues.slaVencido);
            const tempoMedio = parseFloat(item.dataValues.tempoMedioResolucao) || 0;

            return {
                usuario: item.responsavel,
                totalTickets: total,
                ticketsResolvidos: resolvidos,
                taxaResolucao: total > 0 ? Math.round((resolvidos / total) * 100) : 0,
                tempoMedioResolucao: Math.round(tempoMedio / 3600), // em horas
                slaCompliance: total > 0 ? Math.round((slaDentroPrazo / total) * 100) : 0,
                slaVencido: slaVencido
            };
        });

        res.status(200).json(resultado);
    } catch (error) {
        console.error('Erro ao buscar performance de usuários:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

module.exports = router;