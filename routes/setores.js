const express = require('express');
const router = express.Router();
const { Setor } = require('../models');
const { authMiddleware } = require('../middleware/auth');

// Rota para buscar todos os setores (acesso por qualquer usuário logado)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const setores = await Setor.findAll({
            attributes: ['id', 'nome']
        });
        res.status(200).json(setores);
    } catch (error) {
        console.error('Erro ao buscar setores:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Rota para criar um novo setor (apenas admin)
router.post('/', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem criar setores.' });
        }
        
        const { nome } = req.body;
        
        // Validação dos campos obrigatórios
        if (!nome || !nome.trim()) {
            return res.status(400).json({ error: 'O nome do setor é obrigatório.' });
        }
        
        const nomeTrimmed = nome.trim();
        
        if (nomeTrimmed.length < 2) {
            return res.status(400).json({ error: 'O nome do setor deve ter pelo menos 2 caracteres.' });
        }
        
        // Verificar se o setor já existe
        const existingSetor = await Setor.findOne({ where: { nome: nomeTrimmed } });
        if (existingSetor) {
            return res.status(400).json({ error: 'Este setor já existe.' });
        }

        const novoSetor = await Setor.create({ nome: nomeTrimmed });
        
        // Retornar dados do setor criado
        const setorResponse = {
            id: novoSetor.id,
            nome: novoSetor.nome,
            createdAt: novoSetor.createdAt
        };
        
        res.status(201).json(setorResponse);
    } catch (error) {
        console.error('Erro ao criar setor:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ error: 'Este setor já existe.' });
        }
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Rota para excluir um setor (apenas admin)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem excluir setores.' });
        }
        
        const { id } = req.params;
        const { force } = req.query; // Parâmetro para forçar exclusão
        
        // Verificar se o setor existe
        const setor = await Setor.findByPk(id);
        if (!setor) {
            return res.status(404).json({ error: 'Setor não encontrado.' });
        }
        
        // Verificar se é o setor de Administração (não pode ser excluído)
        if (setor.nome === 'Administração') {
            return res.status(400).json({ 
                error: 'Não é possível excluir o setor "Administração" pois é um setor essencial do sistema.' 
            });
        }
        
        // Verificar se há tickets associados a este setor
        const { Ticket } = require('../models');
        const ticketsCount = await Ticket.count({ where: { setor: setor.nome } });
        
        // Verificar se há usuários associados a este setor
        const { UserSetor } = require('../models');
        const usersCount = await UserSetor.count({ where: { setorId: id } });
        
        // Se há dependências e não foi forçado, retornar erro com detalhes
        if (!force && (ticketsCount > 0 || usersCount > 0)) {
            return res.status(400).json({ 
                error: `Não é possível excluir o setor "${setor.nome}" pois existem dependências:`,
                details: {
                    tickets: ticketsCount,
                    users: usersCount
                },
                canForce: true,
                message: 'Use o parâmetro force=true para forçar a exclusão (isso irá mover tickets para "Geral" e remover usuários do setor).'
            });
        }
        
        // Se foi forçado, fazer as migrações necessárias
        if (force === 'true') {
            // Migrar tickets para setor "Geral"
            if (ticketsCount > 0) {
                await Ticket.update(
                    { setor: 'Geral' },
                    { where: { setor: setor.nome } }
                );
                console.log(`📦 ${ticketsCount} tickets migrados do setor "${setor.nome}" para "Geral"`);
            }
            
            // Remover usuários do setor
            if (usersCount > 0) {
                await UserSetor.destroy({ where: { setorId: id } });
                console.log(`👥 ${usersCount} usuários removidos do setor "${setor.nome}"`);
            }
        }
        
        // Excluir o setor
        await setor.destroy();
        
        console.log(`✅ Setor "${setor.nome}" excluído por admin ${req.user.username}${force === 'true' ? ' (forçado)' : ''}`);
        
        res.status(200).json({ 
            message: `Setor "${setor.nome}" excluído com sucesso.${force === 'true' ? ' Dependências foram migradas.' : ''}`,
            setorId: id,
            migrated: {
                tickets: ticketsCount,
                users: usersCount
            }
        });
    } catch (error) {
        console.error('Erro ao excluir setor:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Rota para verificar dependências de um setor antes da exclusão
router.get('/:id/dependencies', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem verificar dependências.' });
        }
        
        const { id } = req.params;
        
        // Verificar se o setor existe
        const setor = await Setor.findByPk(id);
        if (!setor) {
            return res.status(404).json({ error: 'Setor não encontrado.' });
        }
        
        // Verificar se é o setor de Administração
        if (setor.nome === 'Administração') {
            return res.status(400).json({ 
                error: 'O setor "Administração" não pode ser excluído pois é essencial para o sistema.',
                canDelete: false
            });
        }
        
        // Verificar dependências
        const { Ticket, UserSetor } = require('../models');
        const ticketsCount = await Ticket.count({ where: { setor: setor.nome } });
        const usersCount = await UserSetor.count({ where: { setorId: id } });
        
        // Buscar detalhes dos tickets
        const tickets = await Ticket.findAll({
            where: { setor: setor.nome },
            attributes: ['id', 'titulo', 'status', 'createdAt'],
            limit: 10,
            order: [['createdAt', 'DESC']]
        });
        
        // Buscar detalhes dos usuários
        const users = await UserSetor.findAll({
            where: { setorId: id },
            include: [{
                model: require('../models').User,
                attributes: ['id', 'username', 'email']
            }],
            limit: 10
        });
        
        const hasDependencies = ticketsCount > 0 || usersCount > 0;
        
        res.status(200).json({
            setor: {
                id: setor.id,
                nome: setor.nome
            },
            dependencies: {
                tickets: {
                    count: ticketsCount,
                    samples: tickets
                },
                users: {
                    count: usersCount,
                    samples: users.map(u => ({
                        id: u.User.id,
                        username: u.User.username,
                        email: u.User.email
                    }))
                }
            },
            canDelete: !hasDependencies,
            canForce: hasDependencies,
            message: hasDependencies 
                ? 'O setor possui dependências. Use force=true para forçar a exclusão.'
                : 'O setor pode ser excluído com segurança.'
        });
    } catch (error) {
        console.error('Erro ao verificar dependências:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

module.exports = router;