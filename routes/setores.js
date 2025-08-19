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
        
        // Verificar se o setor existe
        const setor = await Setor.findByPk(id);
        if (!setor) {
            return res.status(404).json({ error: 'Setor não encontrado.' });
        }
        
        // Verificar se há tickets associados a este setor
        const { Ticket } = require('../models');
        const ticketsCount = await Ticket.count({ where: { setor: setor.nome } });
        
        if (ticketsCount > 0) {
            return res.status(400).json({ 
                error: `Não é possível excluir o setor "${setor.nome}" pois existem ${ticketsCount} ticket(s) associado(s) a ele.` 
            });
        }
        
        // Verificar se há usuários associados a este setor
        const { UserSetor } = require('../models');
        const usersCount = await UserSetor.count({ where: { setorId: id } });
        
        if (usersCount > 0) {
            return res.status(400).json({ 
                error: `Não é possível excluir o setor "${setor.nome}" pois existem ${usersCount} usuário(s) associado(s) a ele.` 
            });
        }
        
        // Excluir o setor
        await setor.destroy();
        
        console.log(`✅ Setor "${setor.nome}" excluído por admin ${req.user.username}`);
        
        res.status(200).json({ 
            message: `Setor "${setor.nome}" excluído com sucesso.`,
            setorId: id
        });
    } catch (error) {
        console.error('Erro ao excluir setor:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

module.exports = router;