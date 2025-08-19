const express = require('express');
const router = express.Router();
const { SLA, Setor } = require('../models');
const { authMiddleware } = require('../middleware/auth');

// Rota para buscar todos os SLAs (apenas admin)
router.get('/', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem visualizar SLAs.' });
        }

        const slas = await SLA.findAll({
            include: [{
                model: Setor,
                as: 'setor',
                attributes: ['id', 'nome']
            }],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json(slas);
    } catch (error) {
        console.error('Erro ao buscar SLAs:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Rota para buscar SLA de um setor específico
router.get('/setor/:setorId', authMiddleware, async (req, res) => {
    try {
        const { setorId } = req.params;

        const sla = await SLA.findOne({
            where: { setorId, ativo: true },
            include: [{
                model: Setor,
                as: 'setor',
                attributes: ['id', 'nome']
            }]
        });

        if (!sla) {
            return res.status(404).json({ error: 'SLA não encontrado para este setor.' });
        }

        res.status(200).json(sla);
    } catch (error) {
        console.error('Erro ao buscar SLA do setor:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Rota para criar um novo SLA (apenas admin)
router.post('/', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem criar SLAs.' });
        }
        
        const { setorId, diasSLA, descricao } = req.body;
        
        // Validação dos campos obrigatórios
        if (!setorId || !diasSLA) {
            return res.status(400).json({ error: 'Setor e dias de SLA são obrigatórios.' });
        }
        
        if (diasSLA < 1 || diasSLA > 365) {
            return res.status(400).json({ error: 'Os dias de SLA devem estar entre 1 e 365.' });
        }

        // Verificar se o setor existe
        const setor = await Setor.findByPk(setorId);
        if (!setor) {
            return res.status(400).json({ error: 'Setor não encontrado.' });
        }

        // Desativar SLA anterior do setor se existir
        await SLA.update(
            { ativo: false },
            { where: { setorId, ativo: true } }
        );

        // Criar novo SLA
        const novoSLA = await SLA.create({
            setorId,
            diasSLA,
            descricao: descricao || 'SLA padrão',
            ativo: true
        });

        // Buscar o SLA criado com dados do setor
        const slaCompleto = await SLA.findByPk(novoSLA.id, {
            include: [{
                model: Setor,
                as: 'setor',
                attributes: ['id', 'nome']
            }]
        });
        
        res.status(201).json(slaCompleto);
    } catch (error) {
        console.error('Erro ao criar SLA:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Rota para atualizar um SLA (apenas admin)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem editar SLAs.' });
        }
        
        const { id } = req.params;
        const { diasSLA, descricao, ativo } = req.body;
        
        const sla = await SLA.findByPk(id);
        if (!sla) {
            return res.status(404).json({ error: 'SLA não encontrado.' });
        }

        if (diasSLA && (diasSLA < 1 || diasSLA > 365)) {
            return res.status(400).json({ error: 'Os dias de SLA devem estar entre 1 e 365.' });
        }

        await sla.update({
            diasSLA: diasSLA || sla.diasSLA,
            descricao: descricao || sla.descricao,
            ativo: ativo !== undefined ? ativo : sla.ativo
        });

        // Buscar o SLA atualizado com dados do setor
        const slaAtualizado = await SLA.findByPk(id, {
            include: [{
                model: Setor,
                as: 'setor',
                attributes: ['id', 'nome']
            }]
        });
        
        res.status(200).json(slaAtualizado);
    } catch (error) {
        console.error('Erro ao atualizar SLA:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Rota para deletar um SLA (apenas admin)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem deletar SLAs.' });
        }
        
        const { id } = req.params;
        
        const sla = await SLA.findByPk(id);
        if (!sla) {
            return res.status(404).json({ error: 'SLA não encontrado.' });
        }

        await sla.destroy();
        
        res.status(200).json({ message: 'SLA deletado com sucesso.' });
    } catch (error) {
        console.error('Erro ao deletar SLA:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

module.exports = router;



