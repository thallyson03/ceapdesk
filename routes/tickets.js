// routes/tickets.js
const express = require('express');
const router = express.Router();
const { Ticket, HistoricoTicket, Anotacao, User, SLA, Setor } = require('../models');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { Op } = require('sequelize');
const notificationService = require('../services/notificationService');
const SLAService = require('../services/slaService');

// Função para calcular e atualizar status do SLA
async function atualizarStatusSLA(ticket) {
    const hoje = new Date();
    const dataLimite = new Date(ticket.dataLimiteSLA);
    
    // Calcular dias úteis restantes
    const diasUteisRestantes = await SLAService.getRemainingBusinessDays(dataLimite, hoje);
    
    let novoStatusSLA = 'dentro_prazo';
    
    if (diasUteisRestantes < 0) {
        novoStatusSLA = 'vencido';
    } else if (diasUteisRestantes <= 1) {
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
        const { titulo, descricao, cpfCnpj, nomeCliente, numeroContato, prioridade, areaResponsavel, assuntoId } = req.body;
        
        // Buscar SLA do setor
        let diasSLA = 3; // SLA padrão em dias úteis
        
        if (areaResponsavel) {
            const setor = await Setor.findOne({ where: { nome: areaResponsavel } });
            if (setor) {
                const sla = await SLA.findOne({ 
                    where: { setorId: setor.id, ativo: true } 
                });
                if (sla) {
                    diasSLA = sla.diasSLA;
                }
            }
        }
        
        // Calcular data limite da SLA considerando apenas dias úteis
        const dataLimiteSLA = await SLAService.calculateSLADueDate(new Date(), diasSLA);
        
        // Criar ticket SEM responsável automático - será atribuído posteriormente
        const novoTicket = await Ticket.create({
            titulo,
            descricao,
            cpfCnpj,
            nomeCliente,
            numeroContato,
            assuntoId: assuntoId || null,
            setor: areaResponsavel || 'Geral',
            solicitante: req.user.username,
            prioridade: prioridade || 'media',
            status: 'aberto',
            responsavel: null, // Sem responsável - será atribuído pelo setor
            diasSLA,
            dataLimiteSLA,
            statusSLA: 'dentro_prazo'
        });

        // Enviar notificação por email (assíncrono - não bloqueia a resposta)
        const setorParaNotificar = areaResponsavel || 'Geral';
        notificationService.notifyNewTicket(novoTicket, setorParaNotificar)
            .then(result => {
                // Notificação processada silenciosamente
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

        // Ticket atribuído/desatribuído silenciosamente

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
        const { search, status, startDate, endDate, responsavel } = req.query;
        let { page = 1, limit = 10 } = req.query;

        // Garantir que page e limit sejam números válidos para evitar OFFSET NaN
        let pageNumber = parseInt(page, 10);
        let limitNumber = parseInt(limit, 10);

        if (isNaN(pageNumber) || pageNumber < 1) {
            pageNumber = 1;
        }
        if (isNaN(limitNumber) || limitNumber < 1) {
            limitNumber = 10;
        }

        const offset = (pageNumber - 1) * limitNumber;
        let whereCondition = {};
        
        if (req.user.role !== 'admin') {
            // Debug: verificar setores do usuário
            console.log(`🔍 [DEBUG] Usuário: ${req.user.username}, Setores no token:`, req.user.setoresNomes);
            
            // Filtrar por todos os setores do usuário
            // Se o usuário passar um filtro de setor específico, verificar se ele tem acesso
            if (req.query.setor) {
                // Verificar se o usuário tem acesso ao setor filtrado
                if (req.user.setoresNomes && req.user.setoresNomes.includes(req.query.setor)) {
                    whereCondition.setor = req.query.setor;
                    console.log(`🔍 [DEBUG] Filtro de setor aplicado: ${req.query.setor}`);
                } else {
                    // Se não tiver acesso, retornar erro ou filtrar pelos setores permitidos
                    console.warn(`⚠️ [DEBUG] Usuário ${req.user.username} tentou acessar setor ${req.query.setor} sem permissão. Setores permitidos:`, req.user.setoresNomes);
                    return res.status(403).json({ 
                        error: 'Você não tem acesso ao setor especificado.',
                        allowedSetores: req.user.setoresNomes
                    });
                }
            } else {
                // Sem filtro de setor: mostrar tickets de TODOS os setores do usuário
                const setoresParaFiltrar = req.user.setoresNomes || ['Geral'];
                whereCondition.setor = {
                    [Op.in]: setoresParaFiltrar
                };
                console.log(`🔍 [DEBUG] Filtro de múltiplos setores aplicado:`, setoresParaFiltrar);
            }
        } else {
            // Admin: pode filtrar por setor se especificado
            if (req.query.setor) {
                whereCondition.setor = req.query.setor;
            }
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
        if (responsavel) {
            whereCondition.responsavel = responsavel;
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
            limit: limitNumber,
            offset
        });

        const totalPages = Math.ceil(count / limitNumber);
        const currentPage = pageNumber;

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
                limit: limitNumber,
                hasNext: currentPage < totalPages,
                hasPrev: currentPage > 1
            }
        });
    } catch (error) {
        console.error('Erro ao buscar tickets:', error);
        console.error('Detalhes do erro:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({ 
            error: 'Erro interno do servidor.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
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

// Rota para listar tickets excluídos (apenas admin) - DEVE VIR ANTES DE /:id
router.get('/deleted', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        // Construir condição WHERE
        let whereCondition = {
            deletedAt: { [Op.ne]: null }
        };
        
        // Busca por título ou descrição
        if (search) {
            whereCondition[Op.or] = [
                { titulo: { [Op.like]: `%${search}%` } },
                { descricao: { [Op.like]: `%${search}%` } }
            ];
        }
        
        let count = 0;
        let tickets = [];
        
        try {
            // Usar paranoid: false para incluir deletados
            const result = await Ticket.findAndCountAll({
                where: whereCondition,
                paranoid: false, // Incluir deletados
                order: [['deletedAt', 'DESC']],
                limit: parseInt(limit),
                offset: offset,
                attributes: { exclude: [] } // Incluir todos os atributos
            });
            
            count = result.count || 0;
            tickets = result.rows || [];
            
        } catch (dbError) {
            // Log detalhado do erro
            console.error('❌ Erro na query de tickets excluídos:', dbError);
            console.error('📝 Mensagem:', dbError.message);
            console.error('📚 Nome:', dbError.name);
            console.error('📚 Stack completo:', dbError.stack);
            
            // Verificar tipo de erro
            const errorMessage = String(dbError.message || '').toLowerCase();
            const errorName = String(dbError.name || '').toLowerCase();
            const errorString = JSON.stringify(dbError).toLowerCase();
            
            // Se for erro relacionado ao banco ou coluna, retornar vazio
            if (errorMessage.includes('deletedat') || 
                errorMessage.includes('column') || 
                errorMessage.includes('does not exist') ||
                errorMessage.includes('não existe') ||
                errorMessage.includes('unknown column') ||
                errorName.includes('sequelizedatabaseerror') ||
                errorName.includes('databaseerror') ||
                errorString.includes('deletedat')) {
                console.warn('⚠️  Erro relacionado ao banco de dados. Retornando array vazio.');
                count = 0;
                tickets = [];
            } else {
                // Re-lançar o erro para ser capturado pelo catch externo
                throw dbError;
            }
        }
        
        const totalPages = Math.ceil(count / parseInt(limit)) || 0;
        
        res.status(200).json({
            tickets: tickets || [],
            pagination: {
                total: count || 0,
                totalPages: totalPages,
                currentPage: parseInt(page) || 1,
                limit: parseInt(limit) || 10,
                hasNext: (parseInt(page) || 1) < totalPages,
                hasPrev: (parseInt(page) || 1) > 1
            }
        });
        
    } catch (error) {
        console.error('❌ Erro ao buscar tickets excluídos:', error);
        console.error('📝 Detalhes do erro:', error.message);
        console.error('📚 Nome do erro:', error.name);
        console.error('📚 Stack completo:', error.stack);
        
        // Verificar tipo de erro
        const errorMessage = String(error.message || '').toLowerCase();
        const errorName = String(error.name || '').toLowerCase();
        
        // Se for erro relacionado ao banco, retornar array vazio
        if (errorMessage.includes('deletedat') || 
            errorMessage.includes('column') || 
            errorMessage.includes('does not exist') ||
            errorMessage.includes('não existe') ||
            errorMessage.includes('unknown column') ||
            errorName.includes('sequelizedatabaseerror') ||
            errorName.includes('databaseerror')) {
            console.warn('⚠️  Retornando array vazio - erro relacionado ao banco de dados');
            return res.status(200).json({
                tickets: [],
                pagination: {
                    total: 0,
                    totalPages: 0,
                    currentPage: parseInt(req.query.page) || 1,
                    limit: parseInt(req.query.limit) || 10,
                    hasNext: false,
                    hasPrev: false
                }
            });
        }
        
        res.status(500).json({ 
            error: 'Erro interno do servidor.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
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

// Rota para excluir um ticket (apenas admin) - Soft Delete
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { force } = req.query; // Opção para hard delete (se necessário)
        
        const ticket = await Ticket.findByPk(id);
        
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket não encontrado.' });
        }
        
        // Verificar se já está deletado
        if (ticket.deletedAt) {
            return res.status(400).json({ 
                error: 'Ticket já foi excluído.',
                deletedAt: ticket.deletedAt
            });
        }
        
        // Soft delete (recomendado)
        if (force !== 'true') {
            // Registrar no histórico antes de deletar
            await HistoricoTicket.create({
                ticketId: ticket.id,
                alteracao: `Ticket excluído por ${req.user.username}`,
                usuario: req.user.username,
                dataAlteracao: new Date()
            });
            
            // Soft delete do Sequelize
            await ticket.destroy();
            
            return res.status(200).json({ 
                message: 'Ticket excluído com sucesso.',
                ticketId: id,
                deletedAt: new Date(),
                canRestore: true
            });
        }
        
        // Hard delete (apenas se force=true)
        // Primeiro registrar a exclusão
        await HistoricoTicket.create({
            ticketId: ticket.id,
            alteracao: `Ticket excluído permanentemente por ${req.user.username}`,
            usuario: req.user.username,
            dataAlteracao: new Date()
        });
        
        // Excluir anotações e histórico primeiro (cascade)
        await Anotacao.destroy({ where: { ticketId: id }, force: true });
        await HistoricoTicket.destroy({ where: { ticketId: id }, force: true });
        
        // Excluir ticket permanentemente
        await ticket.destroy({ force: true });
        
        return res.status(200).json({ 
            message: 'Ticket excluído permanentemente.',
            ticketId: id,
            warning: 'Esta ação não pode ser desfeita.'
        });
        
    } catch (error) {
        console.error('Erro ao excluir ticket:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Rota para restaurar um ticket excluído (apenas admin)
router.put('/:id/restore', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Buscar ticket deletado (incluindo soft deleted)
        const ticket = await Ticket.findByPk(id, { 
            paranoid: false // Incluir deletados
        });
        
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket não encontrado.' });
        }
        
        if (!ticket.deletedAt) {
            return res.status(400).json({ error: 'Ticket não está excluído.' });
        }
        
        // Restaurar ticket
        await ticket.restore();
        
        // Registrar restauração no histórico
        await HistoricoTicket.create({
            ticketId: ticket.id,
            alteracao: `Ticket restaurado por ${req.user.username}`,
            usuario: req.user.username,
            dataAlteracao: new Date()
        });
        
        // Buscar ticket restaurado com relacionamentos
        const ticketRestaurado = await Ticket.findByPk(id, {
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
            ]
        });
        
        res.status(200).json({ 
            message: 'Ticket restaurado com sucesso.',
            ticket: ticketRestaurado
        });
        
    } catch (error) {
        console.error('Erro ao restaurar ticket:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

module.exports = router;