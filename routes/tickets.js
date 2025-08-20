// routes/tickets.js
const express = require('express');
const router = express.Router();
const { Ticket, HistoricoTicket, Anotacao, User, SLA, Setor } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { Op } = require('sequelize');
const notificationService = require('../services/notificationService');

// Função para calcular e atualizar status do SLA
async function atualizarStatusSLA(ticket) {
    const hoje = new Date();
    const dataLimite = new Date(ticket.dataLimiteSLA);
    const diffTime = dataLimite - hoje;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let novoStatusSLA = 'dentro_prazo';
    
    if (diffDays < 0) {
        novoStatusSLA = 'vencido';
    } else if (diffDays <= 1) {
        novoStatusSLA = 'proximo_vencimento';
    }
    
    if (ticket.statusSLA !== novoStatusSLA) {
        await ticket.update({ statusSLA: novoStatusSLA });
    }
    
    return novoStatusSLA;
}

router.use(authMiddleware);

// Rota para criar um novo ticket
router.post('/', async (req, res) => {
    try {
        const { titulo, descricao, clienteId, prioridade, areaResponsavel } = req.body;
        
        // Buscar SLA do setor
        let diasSLA = 3; // SLA padrão
        let dataLimiteSLA = new Date();
        dataLimiteSLA.setDate(dataLimiteSLA.getDate() + diasSLA);
        
        if (areaResponsavel) {
            const setor = await Setor.findOne({ where: { nome: areaResponsavel } });
            if (setor) {
                const sla = await SLA.findOne({ 
                    where: { setorId: setor.id, ativo: true } 
                });
                if (sla) {
                    diasSLA = sla.diasSLA;
                    dataLimiteSLA = new Date();
                    dataLimiteSLA.setDate(dataLimiteSLA.getDate() + diasSLA);
                }
            }
        }
        
        // Tentar atribuir automaticamente o ticket ao melhor usuário disponível
        let responsavelAutomatico = null;
        if (areaResponsavel) {
            try {
                const bestUser = await notificationService.getBestUserForTicket(areaResponsavel);
                if (bestUser) {
                    responsavelAutomatico = bestUser.username;
                    console.log(`✅ Ticket atribuído automaticamente para: ${bestUser.username} (carga: ${bestUser.workload || 0} tickets)`);
                }
            } catch (error) {
                console.error('❌ Erro ao atribuir ticket automaticamente:', error);
            }
        }

        const novoTicket = await Ticket.create({
            titulo,
            descricao,
            setor: areaResponsavel || 'Geral',
            solicitante: req.user.username,
            prioridade: prioridade || 'media',
            status: 'aberto',
            responsavel: responsavelAutomatico,
            diasSLA,
            dataLimiteSLA,
            statusSLA: 'dentro_prazo'
        });

        // Enviar notificação por email (assíncrono - não bloqueia a resposta)
        const setorParaNotificar = areaResponsavel || 'Geral';
        notificationService.notifyNewTicket(novoTicket, setorParaNotificar)
            .then(result => {
                if (result.success) {
                    console.log(`✅ Notificação enviada: ${result.usersNotified} usuários notificados`);
                } else {
                    console.log(`⚠️ Notificação não enviada: ${result.message}`);
                }
            })
            .catch(error => {
                console.error('❌ Erro ao enviar notificação:', error);
            });

        res.status(201).json(novoTicket);
    } catch (error) {
        console.error('Erro ao criar ticket:', error);
        res.status(500).json({ error: 'Erro interno do servidor.', details: error.message });
    }
});

// Rota para atribuir ticket a um usuário específico
router.put('/:id/assign', async (req, res) => {
    try {
        const { id } = req.params;
        const { responsavel } = req.body;

        const ticket = await Ticket.findByPk(id);
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket não encontrado.' });
        }

        // Verificar se o usuário tem permissão para atribuir tickets
        if (req.user.role !== 'admin') {
            // Verificar se o usuário tem acesso ao setor do ticket
            const hasSetor = req.user.setoresNomes && req.user.setoresNomes.includes(ticket.setor);
            if (!hasSetor) {
                return res.status(403).json({ error: 'Você não tem permissão para atribuir tickets deste setor.' });
            }
        }

        // Verificar se o responsável existe e tem acesso ao setor
        if (responsavel) {
            const user = await User.findOne({
                where: { username: responsavel },
                include: [{
                    model: Setor,
                    as: 'setores',
                    attributes: ['nome'],
                    through: { attributes: [] }
                }]
            });

            if (!user) {
                return res.status(404).json({ error: 'Usuário responsável não encontrado.' });
            }

            const userSetores = user.setores.map(s => s.nome);
            if (!userSetores.includes(ticket.setor)) {
                return res.status(400).json({ error: 'O usuário não tem acesso ao setor deste ticket.' });
            }
        }

        // Atualizar o responsável
        await ticket.update({ responsavel });

        // Registrar no histórico
        await HistoricoTicket.create({
            ticketId: ticket.id,
            acao: responsavel ? 'atribuido' : 'desatribuido',
            detalhes: responsavel ? `Ticket atribuído para ${responsavel}` : 'Ticket desatribuído',
            usuario: req.user.username
        });

        console.log(`✅ Ticket ${id} ${responsavel ? 'atribuído para' : 'desatribuído de'} ${responsavel || 'ninguém'} por ${req.user.username}`);

        res.status(200).json({ 
            message: responsavel ? `Ticket atribuído para ${responsavel}` : 'Ticket desatribuído',
            ticket 
        });
    } catch (error) {
        console.error('Erro ao atribuir ticket:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Rota para buscar usuários disponíveis para atribuição de tickets de um setor
router.get('/setor/:setor/usuarios-disponiveis', async (req, res) => {
    try {
        const { setor } = req.params;

        // Verificar se o usuário tem permissão para ver usuários do setor
        if (req.user.role !== 'admin') {
            const hasSetor = req.user.setoresNomes && req.user.setoresNomes.includes(setor);
            if (!hasSetor) {
                return res.status(403).json({ error: 'Você não tem permissão para visualizar usuários deste setor.' });
            }
        }

        const users = await notificationService.getUsersForTicketAssignment(setor);

        // Adicionar informação de carga de trabalho
        const usersWithWorkload = await Promise.all(
            users.map(async (user) => {
                const openTickets = await Ticket.count({
                    where: {
                        responsavel: user.username,
                        status: {
                            [Op.in]: ['aberto', 'em_andamento']
                        }
                    }
                });

                return {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    workload: openTickets,
                    setores: user.setores
                };
            })
        );

        // Ordenar por carga de trabalho (menor primeiro)
        usersWithWorkload.sort((a, b) => a.workload - b.workload);

        res.status(200).json(usersWithWorkload);
    } catch (error) {
        console.error('Erro ao buscar usuários disponíveis:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Rota para buscar setores disponíveis para filtros
router.get('/setores-disponiveis', async (req, res) => {
    try {
        let whereCondition = {};
        
        if (req.user.role !== 'admin') {
            // Filtrar apenas setores do usuário
            whereCondition.nome = {
                [Op.in]: req.user.setoresNomes
            };
        }

        const setores = await Setor.findAll({
            where: whereCondition,
            attributes: ['id', 'nome'],
            order: [['nome', 'ASC']]
        });

        res.status(200).json(setores);
    } catch (error) {
        console.error('Erro ao buscar setores disponíveis:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Rota para obter todos os tickets com filtros de busca, status e paginação
router.get('/', async (req, res) => {
    try {
        const { search, status, startDate, endDate, page = 1, limit = 10 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        let whereCondition = {};
        
        if (req.user.role !== 'admin') {
            // Filtrar por todos os setores do usuário
            whereCondition.setor = {
                [Op.in]: req.user.setoresNomes
            };
        }

        if (search) {
            whereCondition[Op.or] = [
                { titulo: { [Op.like]: `%${search}%` } },
                { descricao: { [Op.like]: `%${search}%` } }
            ];
        }
        if (status) {
            whereCondition.status = status;
        }
        if (req.query.setor) {
            whereCondition.setor = req.query.setor;
        }
        if (req.query.prioridade) {
            whereCondition.prioridade = req.query.prioridade;
        }
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

        const { count, rows: tickets } = await Ticket.findAndCountAll({
            where: whereCondition,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: offset
        });

        const totalPages = Math.ceil(count / parseInt(limit));
        const currentPage = parseInt(page);

        // Atualizar status SLA para cada ticket
        for (let ticket of tickets) {
            await atualizarStatusSLA(ticket);
        }
        
        res.status(200).json({
            tickets,
            pagination: {
                total: count,
                totalPages,
                currentPage,
                limit: parseInt(limit),
                hasNext: currentPage < totalPages,
                hasPrev: currentPage > 1
            }
        });
    } catch (error) {
        console.error('Erro ao buscar tickets:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Rota para buscar tickets com SLA vencido ou próximo do vencimento
router.get('/sla/alertas', async (req, res) => {
    try {
        let whereCondition = {
            statusSLA: {
                [Op.in]: ['vencido', 'proximo_vencimento']
            }
        };
        
        if (req.user.role !== 'admin') {
            // Filtrar por todos os setores do usuário
            whereCondition.setor = {
                [Op.in]: req.user.setoresNomes
            };
        }

        const tickets = await Ticket.findAll({
            where: whereCondition,
            order: [['dataLimiteSLA', 'ASC']]
        });

        // Atualizar status SLA para cada ticket
        for (let ticket of tickets) {
            await atualizarStatusSLA(ticket);
        }

        res.status(200).json(tickets);
    } catch (error) {
        console.error('Erro ao buscar tickets com SLA vencido:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Rota para obter detalhes de um ticket (agora inclui anotações e histórico)
router.get('/:id', async (req, res) => {
    try {
        const ticket = await Ticket.findByPk(req.params.id, {
            include: [
                {
                    model: HistoricoTicket,
                    as: 'historico',
                    attributes: ['alteracao', 'usuario', 'dataAlteracao', 'createdAt']
                },
                {
                    model: Anotacao,
                    as: 'anotacoes',
                    attributes: ['id', 'conteudo', 'autor', 'createdAt']
                }
            ],
            order: [
                [{ model: Anotacao, as: 'anotacoes' }, 'createdAt', 'ASC']
            ]
        });
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket não encontrado.' });
        }
        if (req.user.role !== 'admin' && !req.user.setoresNomes.includes(ticket.setor)) {
            return res.status(403).json({ error: 'Acesso negado. Você não tem permissão para visualizar este ticket.' });
        }
        res.status(200).json(ticket);
    } catch (error) {
        console.error('Erro ao buscar ticket:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Rota para atualizar um ticket
router.put('/:id', async (req, res) => {
    try {
        const ticket = await Ticket.findByPk(req.params.id);
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket não encontrado.' });
        }

        if (req.user.role !== 'admin' && !req.user.setoresNomes.includes(ticket.setor)) {
            return res.status(403).json({ error: 'Acesso negado. Você não tem permissão para editar este ticket.' });
        }

        const { status, responsavel, prioridade, setor } = req.body;
        const alteracoes = [];

        // Lógica de atualização de status
        if (status && ticket.status !== status) {
            alteracoes.push({
                alteracao: `Status alterado de ${ticket.status} para ${status}`,
                usuario: req.user.username,
                dataAlteracao: new Date(),
                ticketId: ticket.id
            });
            ticket.status = status;
        }

        // Lógica de atualização de usuário responsável
        if (responsavel && ticket.responsavel !== responsavel) {
            alteracoes.push({
                alteracao: `Responsável alterado de ${ticket.responsavel || 'Nenhum'} para ${responsavel}`,
                usuario: req.user.username,
                dataAlteracao: new Date(),
                ticketId: ticket.id
            });
            ticket.responsavel = responsavel;
        }
        
        // Lógica de atualização de prioridade
        if (prioridade && ticket.prioridade !== prioridade) {
            alteracoes.push({
                alteracao: `Prioridade alterada de ${ticket.prioridade} para ${prioridade}`,
                usuario: req.user.username,
                dataAlteracao: new Date(),
                ticketId: ticket.id
            });
            ticket.prioridade = prioridade;
        }
        
        // Lógica de atualização do setor responsável
        if (setor && ticket.setor !== setor) {
            alteracoes.push({
                alteracao: `Setor alterado de ${ticket.setor} para ${setor}`,
                usuario: req.user.username,
                dataAlteracao: new Date(),
                ticketId: ticket.id
            });
            ticket.setor = setor;
        }

        if (status === 'fechado' && !ticket.dataEncerramento) {
            ticket.dataEncerramento = new Date();
        } else if (status !== 'fechado' && ticket.dataEncerramento) {
            ticket.dataEncerramento = null;
        }

        if (alteracoes.length > 0) {
            await ticket.save();
            await HistoricoTicket.bulkCreate(alteracoes);
        }

        const ticketAtualizado = await Ticket.findByPk(req.params.id, {
            include: [
                {
                    model: HistoricoTicket,
                    as: 'historico',
                    attributes: ['alteracao', 'usuario', 'dataAlteracao', 'createdAt']
                },
                {
                    model: Anotacao,
                    as: 'anotacoes',
                    attributes: ['id', 'conteudo', 'autor', 'createdAt']
                }
            ],
            order: [
                [{ model: Anotacao, as: 'anotacoes' }, 'createdAt', 'ASC']
            ]
        });

        res.status(200).json(ticketAtualizado);
    } catch (error) {
        console.error('Erro ao atualizar ticket:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Rota para adicionar anotação a um ticket
router.post('/:id/anotacoes', async (req, res) => {
    try {
        const { conteudo } = req.body;
        const ticketId = req.params.id;
        const novaAnotacao = await Anotacao.create({
            conteudo,
            ticketId: ticketId,
            autor: req.user.username
        });
        res.status(201).json(novaAnotacao);
    } catch (error) {
        console.error('Erro ao adicionar anotação:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Rota para obter todas as anotações de um ticket
router.get('/:id/anotacoes', async (req, res) => {
    try {
        const ticketId = req.params.id;
        const anotacoes = await Anotacao.findAll({
            where: { ticketId: ticketId },
            order: [['createdAt', 'ASC']]
        });
        res.status(200).json(anotacoes);
    } catch (error) {
        console.error('Erro ao buscar anotações:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

module.exports = router;