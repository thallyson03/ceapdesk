const express = require('express');
const router = express.Router();
const { Assunto, Setor } = require('../models');
const { authMiddleware } = require('../middleware/auth');

// Middleware para verificar se é admin
const adminMiddleware = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem gerenciar assuntos.' });
    }
    next();
};

// Rota para buscar todos os assuntos (apenas admin)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const assuntos = await Assunto.findAll({
            include: [{
                model: Setor,
                as: 'setor',
                attributes: ['id', 'nome']
            }],
            order: [['nome', 'ASC']]
        });
        res.status(200).json(assuntos);
    } catch (error) {
        console.error('Erro ao buscar assuntos:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Rota para buscar assuntos por setor (acesso público para usuários logados)
router.get('/setor/:setorId', authMiddleware, async (req, res) => {
    try {
        const { setorId } = req.params;
        
        const assuntos = await Assunto.findAll({
            where: {
                setorId: setorId,
                ativo: true
            },
            include: [{
                model: Setor,
                as: 'setor',
                attributes: ['id', 'nome']
            }],
            order: [['nome', 'ASC']]
        });
        
        res.status(200).json(assuntos);
    } catch (error) {
        console.error('Erro ao buscar assuntos por setor:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Rota para criar um novo assunto (apenas admin)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { nome, descricao, setorId } = req.body;
        
        // Validação dos campos obrigatórios
        if (!nome || !nome.trim()) {
            return res.status(400).json({ error: 'O nome do assunto é obrigatório.' });
        }
        
        if (!setorId) {
            return res.status(400).json({ error: 'O setor é obrigatório.' });
        }
        
        const nomeTrimmed = nome.trim();
        
        if (nomeTrimmed.length < 2) {
            return res.status(400).json({ error: 'O nome do assunto deve ter pelo menos 2 caracteres.' });
        }
        
        // Verificar se o setor existe
        const setor = await Setor.findByPk(setorId);
        if (!setor) {
            return res.status(400).json({ error: 'Setor não encontrado.' });
        }
        
        // Verificar se já existe um assunto com o mesmo nome no setor
        const existingAssunto = await Assunto.findOne({
            where: {
                nome: nomeTrimmed,
                setorId: setorId
            }
        });
        
        if (existingAssunto) {
            return res.status(400).json({ error: 'Já existe um assunto com este nome neste setor.' });
        }

        const novoAssunto = await Assunto.create({
            nome: nomeTrimmed,
            descricao: descricao || null,
            setorId: setorId,
            ativo: true
        });
        
        // Retornar dados do assunto criado com informações do setor
        const assuntoResponse = await Assunto.findByPk(novoAssunto.id, {
            include: [{
                model: Setor,
                as: 'setor',
                attributes: ['id', 'nome']
            }]
        });
        
        res.status(201).json(assuntoResponse);
    } catch (error) {
        console.error('Erro ao criar assunto:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Rota para atualizar um assunto (apenas admin)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, descricao, setorId, ativo } = req.body;
        
        const assunto = await Assunto.findByPk(id);
        if (!assunto) {
            return res.status(404).json({ error: 'Assunto não encontrado.' });
        }
        
        // Validação dos campos
        if (nome && !nome.trim()) {
            return res.status(400).json({ error: 'O nome do assunto é obrigatório.' });
        }
        
        if (setorId) {
            const setor = await Setor.findByPk(setorId);
            if (!setor) {
                return res.status(400).json({ error: 'Setor não encontrado.' });
            }
        }
        
        // Verificar se já existe outro assunto com o mesmo nome no setor
        if (nome && setorId) {
            const existingAssunto = await Assunto.findOne({
                where: {
                    nome: nome.trim(),
                    setorId: setorId,
                    id: { [Assunto.sequelize.Op.ne]: id }
                }
            });
            
            if (existingAssunto) {
                return res.status(400).json({ error: 'Já existe um assunto com este nome neste setor.' });
            }
        }
        
        // Atualizar o assunto
        const updateData = {};
        if (nome) updateData.nome = nome.trim();
        if (descricao !== undefined) updateData.descricao = descricao;
        if (setorId) updateData.setorId = setorId;
        if (ativo !== undefined) updateData.ativo = ativo;
        
        await assunto.update(updateData);
        
        // Retornar dados atualizados
        const assuntoAtualizado = await Assunto.findByPk(id, {
            include: [{
                model: Setor,
                as: 'setor',
                attributes: ['id', 'nome']
            }]
        });
        
        res.status(200).json(assuntoAtualizado);
    } catch (error) {
        console.error('Erro ao atualizar assunto:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Rota para excluir um assunto (apenas admin)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        
        const assunto = await Assunto.findByPk(id);
        if (!assunto) {
            return res.status(404).json({ error: 'Assunto não encontrado.' });
        }
        
        // Verificar se há tickets usando este assunto
        const ticketsCount = await assunto.countTickets();
        if (ticketsCount > 0) {
            return res.status(400).json({ 
                error: 'Não é possível excluir este assunto pois existem tickets vinculados a ele.',
                ticketsCount: ticketsCount
            });
        }
        
        await assunto.destroy();
        res.status(200).json({ message: 'Assunto excluído com sucesso.' });
    } catch (error) {
        console.error('Erro ao excluir assunto:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

module.exports = router;
