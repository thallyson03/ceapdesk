const express = require('express');
const router = express.Router();
const { Feriado } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const SLAService = require('../services/slaService');

// Middleware para verificar se é admin
const adminMiddleware = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem gerenciar feriados.' });
    }
    next();
};

// Rota para buscar todos os feriados
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { ano } = req.query;
        let whereClause = {};
        
        if (ano) {
            whereClause.data = {
                [require('sequelize').Op.like]: `${ano}-%`
            };
        }
        
        const feriados = await Feriado.findAll({
            where: whereClause,
            order: [['data', 'ASC']]
        });
        
        res.status(200).json(feriados);
    } catch (error) {
        console.error('Erro ao buscar feriados:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Rota para buscar feriados por ano
router.get('/ano/:ano', authMiddleware, async (req, res) => {
    try {
        const { ano } = req.params;
        
        const feriados = await Feriado.findAll({
            where: {
                data: {
                    [require('sequelize').Op.like]: `${ano}-%`
                },
                ativo: true
            },
            order: [['data', 'ASC']]
        });
        
        res.status(200).json(feriados);
    } catch (error) {
        console.error('Erro ao buscar feriados por ano:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Rota para criar um novo feriado
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { nome, data, tipo, descricao } = req.body;
        
        // Validação dos campos obrigatórios
        if (!nome || !nome.trim()) {
            return res.status(400).json({ error: 'O nome do feriado é obrigatório.' });
        }
        
        if (!data) {
            return res.status(400).json({ error: 'A data do feriado é obrigatória.' });
        }
        
        // Validar formato da data
        const dataRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dataRegex.test(data)) {
            return res.status(400).json({ error: 'Formato de data inválido. Use YYYY-MM-DD.' });
        }
        
        // Verificar se já existe um feriado nesta data
        const existingFeriado = await Feriado.findOne({
            where: { data: data }
        });
        
        if (existingFeriado) {
            return res.status(400).json({ error: 'Já existe um feriado cadastrado nesta data.' });
        }
        
        const novoFeriado = await Feriado.create({
            nome: nome.trim(),
            data: data,
            tipo: tipo || 'nacional',
            descricao: descricao || null,
            ativo: true
        });
        
        res.status(201).json(novoFeriado);
    } catch (error) {
        console.error('Erro ao criar feriado:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Rota para atualizar um feriado
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, data, tipo, descricao, ativo } = req.body;
        
        const feriado = await Feriado.findByPk(id);
        if (!feriado) {
            return res.status(404).json({ error: 'Feriado não encontrado.' });
        }
        
        // Validação dos campos
        if (nome && !nome.trim()) {
            return res.status(400).json({ error: 'O nome do feriado é obrigatório.' });
        }
        
        if (data) {
            const dataRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dataRegex.test(data)) {
                return res.status(400).json({ error: 'Formato de data inválido. Use YYYY-MM-DD.' });
            }
            
            // Verificar se já existe outro feriado nesta data
            const existingFeriado = await Feriado.findOne({
                where: {
                    data: data,
                    id: { [require('sequelize').Op.ne]: id }
                }
            });
            
            if (existingFeriado) {
                return res.status(400).json({ error: 'Já existe outro feriado cadastrado nesta data.' });
            }
        }
        
        // Atualizar o feriado
        const updateData = {};
        if (nome) updateData.nome = nome.trim();
        if (data) updateData.data = data;
        if (tipo) updateData.tipo = tipo;
        if (descricao !== undefined) updateData.descricao = descricao;
        if (ativo !== undefined) updateData.ativo = ativo;
        
        await feriado.update(updateData);
        
        res.status(200).json(feriado);
    } catch (error) {
        console.error('Erro ao atualizar feriado:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Rota para excluir um feriado
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        
        const feriado = await Feriado.findByPk(id);
        if (!feriado) {
            return res.status(404).json({ error: 'Feriado não encontrado.' });
        }
        
        await feriado.destroy();
        res.status(200).json({ message: 'Feriado excluído com sucesso.' });
    } catch (error) {
        console.error('Erro ao excluir feriado:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Rota para adicionar feriados padrão do Brasil para um ano
router.post('/adicionar-padrao/:ano', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { ano } = req.params;
        const year = parseInt(ano);
        
        if (isNaN(year) || year < 1900 || year > 2100) {
            return res.status(400).json({ error: 'Ano inválido. Use um ano entre 1900 e 2100.' });
        }
        
        // Adicionar feriados fixos
        const feriadosFixos = await SLAService.addDefaultBrazilianHolidays(year);
        
        // Adicionar feriados móveis
        const feriadosMoveis = await SLAService.addMovableHolidays(year);
        
        const totalFeriados = feriadosFixos.length + feriadosMoveis.length;
        
        res.status(200).json({
            message: `Feriados padrão adicionados para ${year}`,
            feriadosFixos: feriadosFixos.length,
            feriadosMoveis: feriadosMoveis.length,
            total: totalFeriados
        });
    } catch (error) {
        console.error('Erro ao adicionar feriados padrão:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Rota para verificar se uma data é dia útil
router.get('/verificar-dia-util/:data', authMiddleware, async (req, res) => {
    try {
        const { data } = req.params;
        const dataRegex = /^\d{4}-\d{2}-\d{2}$/;
        
        if (!dataRegex.test(data)) {
            return res.status(400).json({ error: 'Formato de data inválido. Use YYYY-MM-DD.' });
        }
        
        const date = new Date(data);
        const isBusinessDay = await SLAService.isBusinessDay(date);
        const isWeekend = SLAService.isWeekend(date);
        const isHoliday = await SLAService.isHoliday(date);
        
        res.status(200).json({
            data: data,
            isBusinessDay: isBusinessDay,
            isWeekend: isWeekend,
            isHoliday: isHoliday
        });
    } catch (error) {
        console.error('Erro ao verificar dia útil:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

module.exports = router;
