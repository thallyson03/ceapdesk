const express = require('express');
const router = express.Router();
const { Ticket, User, Setor, sequelize } = require('../models');
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

module.exports = router;