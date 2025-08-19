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
        
        const novoTicket = await Ticket.create({
            titulo,
            descricao,
            setor: areaResponsavel || 'Geral',
            solicitante: req.user.username,
            prioridade: prioridade || 'media',
            status: 'aberto',
            responsavel: null,
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