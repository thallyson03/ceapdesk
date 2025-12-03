const express = require('express');
const router = express.Router();
const { User, Setor, UserSetor, UserSession } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const config = require('../config');
const { Op } = require('sequelize');

// Função para validar complexidade da senha
function validatePasswordComplexity(password) {
    if (!config.REQUIRE_PASSWORD_COMPLEXITY) {
        return password.length >= config.MIN_PASSWORD_LENGTH;
    }
    
    const minLength = password.length >= config.MIN_PASSWORD_LENGTH;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
}

// Rota para buscar todos os usuários (apenas admin)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'username', 'role', 'createdAt'],
            include: [{
                model: Setor,
                as: 'setores',
                attributes: ['id', 'nome'],
                through: { attributes: [] }
            }]
        });
        
        // Retornar usuários com setores, mas sem campo setor virtual
        const usersWithSetores = users.map(user => {
            const userData = user.toJSON();
            // Manter apenas os dados básicos do usuário e seus setores
            return {
                id: userData.id,
                username: userData.username,
                role: userData.role,
                createdAt: userData.createdAt,
                setores: userData.setores || []
            };
        });
        
        res.status(200).json(usersWithSetores);
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Rota para buscar usuários por setor (para usuários comuns)
router.get('/setor/:setor', authMiddleware, async (req, res) => {
    try {
        const { setor } = req.params;
        
        // Usuários comuns só podem ver usuários do seu próprio setor
        if (req.user.role !== 'admin') {
            // Verificar se o usuário tem o setor solicitado
            const hasSetor = req.user.setoresNomes && req.user.setoresNomes.includes(setor);
            if (!hasSetor) {
                return res.status(403).json({ error: 'Acesso negado. Você só pode visualizar usuários do seu setor.' });
            }
        }
        
        const users = await User.findAll({
            attributes: ['id', 'username', 'role'],
            include: [{
                model: Setor,
                as: 'setores',
                where: { nome: setor },
                attributes: ['id', 'nome'],
                through: { attributes: [] }
            }]
        });
        
        // Retornar usuários com setores, mas sem campo setor virtual
        const usersWithSetores = users.map(user => {
            const userData = user.toJSON();
            // Manter apenas os dados básicos do usuário e seus setores
            return {
                id: userData.id,
                username: userData.username,
                role: userData.role,
                setores: userData.setores || []
            };
        });
        
        res.status(200).json(usersWithSetores);
    } catch (error) {
        console.error('Erro ao buscar usuários por setor:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Rota para buscar setores de um usuário específico
router.get('/:userId/setores', authMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Verificar permissões
        if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
            return res.status(403).json({ error: 'Acesso negado. Você só pode visualizar seus próprios setores.' });
        }
        
        const user = await User.findByPk(userId, {
            include: [{
                model: Setor,
                as: 'setores',
                attributes: ['id', 'nome'],
                through: { attributes: [] }
            }]
        });
        
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }
        
        res.status(200).json(user.setores);
    } catch (error) {
        console.error('Erro ao buscar setores do usuário:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Rota para adicionar setores a um usuário
router.post('/:userId/setores', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;
        const { setorIds } = req.body; // Array de IDs dos setores
        
        if (!setorIds || !Array.isArray(setorIds)) {
            return res.status(400).json({ error: 'IDs dos setores são obrigatórios e devem ser um array.' });
        }
        
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }
        
        // Verificar se todos os setores existem
        const setores = await Setor.findAll({
            where: { id: setorIds }
        });
        
        if (setores.length !== setorIds.length) {
            return res.status(400).json({ error: 'Um ou mais setores não foram encontrados.' });
        }
        
        // Remover setores existentes e adicionar os novos
        // Primeiro, remover todas as relações existentes
        await UserSetor.destroy({
            where: { userId: userId }
        });
        
        // Depois, adicionar as novas relações
        if (setores.length > 0) {
            const userSetorRecords = setores.map(setor => ({
                userId: userId,
                setorId: setor.id
            }));
            
            await UserSetor.bulkCreate(userSetorRecords);
        }
        
        // Buscar usuário atualizado com setores
        const userUpdated = await User.findByPk(userId, {
            include: [{
                model: Setor,
                as: 'setores',
                attributes: ['id', 'nome'],
                through: { attributes: [] }
            }]
        });
        
        // Setores atualizados silenciosamente
        
        res.status(200).json({
            message: 'Setores atualizados com sucesso.',
            setores: userUpdated.setores
        });
    } catch (error) {
        console.error('Erro ao adicionar setores ao usuário:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Rota para remover setores de um usuário
router.delete('/:userId/setores/:setorId', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { userId, setorId } = req.params;
        
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }
        
        const setor = await Setor.findByPk(setorId);
        if (!setor) {
            return res.status(404).json({ error: 'Setor não encontrado.' });
        }
        
        // Verificar se a relação existe antes de tentar remover
        const existingRelation = await UserSetor.findOne({
            where: {
                userId: userId,
                setorId: setorId
            }
        });
        
        if (!existingRelation) {
            return res.status(404).json({ error: 'Usuário não possui este setor.' });
        }
        
        // Remover o setor específico usando a tabela de junção
        await UserSetor.destroy({
            where: {
                userId: userId,
                setorId: setorId
            }
        });
        
        // Setor removido silenciosamente
        
        res.status(200).json({ message: 'Setor removido com sucesso.' });
    } catch (error) {
        console.error('Erro ao remover setor do usuário:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Validações para registro de usuário
const registerValidations = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('Nome de usuário deve ter entre 3 e 50 caracteres')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Nome de usuário deve conter apenas letras, números e underscore'),
    body('email')
        .trim()
        .isEmail()
        .withMessage('Email deve ser válido'),
    body('password')
        .isLength({ min: config.MIN_PASSWORD_LENGTH })
        .withMessage(`Senha deve ter pelo menos ${config.MIN_PASSWORD_LENGTH} caracteres`)
        .custom((value) => {
            if (config.REQUIRE_PASSWORD_COMPLEXITY && !validatePasswordComplexity(value)) {
                throw new Error('Senha deve conter maiúsculas, minúsculas, números e caracteres especiais');
            }
            return true;
        }),
    body('role')
        .optional()
        .isIn(['admin', 'user'])
        .withMessage('Role deve ser admin ou user')
];

// Rota para registro de usuários (somente admin)
router.post('/register', authMiddleware, adminMiddleware, registerValidations, async (req, res) => {
    // Verificar erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            error: 'Dados inválidos',
            details: errors.array()
        });
    }
    
    const { username, email, password, setor, role, setorIds } = req.body;
    
    try {
        // Verificar se o usuário já existe
        const existingUser = await User.findOne({ 
            where: { 
                [Op.or]: [
                    { username },
                    { email }
                ]
            }
        });
        if (existingUser) {
            if (existingUser.username === username) {
                return res.status(400).json({ error: 'Este nome de usuário já está em uso.' });
            }
            if (existingUser.email === email) {
                return res.status(400).json({ error: 'Este email já está em uso.' });
            }
        }
        
        const novoUser = await User.create({
            username: username.trim(), 
            email: email.trim(),
            password, 
            role: role || 'user' 
        });
        
        // Montar lista de IDs de setores a partir do setor principal (nome) + setores adicionais (IDs)
        let allSetorIds = [];

        // 1) Setor principal vem como nome (string). Converter para ID.
        if (setor && typeof setor === 'string') {
            const setorPrincipal = await Setor.findOne({ where: { nome: setor } });
            if (setorPrincipal) {
                allSetorIds.push(setorPrincipal.id);
            }
        }

        // 2) Setores adicionais já vêm como IDs (array)
        if (setorIds && Array.isArray(setorIds) && setorIds.length > 0) {
            allSetorIds.push(...setorIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id)));
        }

        // Remover duplicados
        allSetorIds = [...new Set(allSetorIds)];

        // 3) Criar relações UserSetor se houver pelo menos um setor válido
        if (allSetorIds.length > 0) {
            const setores = await Setor.findAll({
                where: { id: allSetorIds }
            });
            
            if (setores.length > 0) {
                const userSetorRecords = setores.map(setor => ({
                    userId: novoUser.id,
                    setorId: setor.id
                }));
                
                await UserSetor.bulkCreate(userSetorRecords);
            }
        }
        
        // Buscar usuário com setores para retornar
        const userWithSetores = await User.findByPk(novoUser.id, {
            include: [{
                model: Setor,
                as: 'setores',
                attributes: ['id', 'nome'],
                through: { attributes: [] }
            }]
        });
        
        // Retornar dados sem a senha
        const userResponse = {
            id: userWithSetores.id,
            username: userWithSetores.username,
            role: userWithSetores.role,
            setores: userWithSetores.setores,
            createdAt: userWithSetores.createdAt
        };
        
        // Usuário criado silenciosamente
        
        res.status(201).json(userResponse);
    } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ error: 'Este nome de usuário já está em uso.' });
        }
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Validações para login
const loginValidations = [
    body('username')
        .trim()
        .notEmpty()
        .withMessage('Nome de usuário é obrigatório'),
    body('password')
        .notEmpty()
        .withMessage('Senha é obrigatória')
];

// Rota de login
router.post('/login', loginValidations, async (req, res) => {
    // Verificar erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            error: 'Dados inválidos',
            details: errors.array()
        });
    }
    
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ 
            where: { username },
            include: [{
                model: Setor,
                as: 'setores',
                attributes: ['id', 'nome'],
                through: { attributes: [] }
            }]
        });

        if (!user) {
            console.warn(`🚨 Tentativa de login com usuário inexistente: ${username} - IP: ${req.ip}`);
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }
        
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            console.warn(`🚨 Tentativa de login com senha incorreta: ${username} - IP: ${req.ip}`);
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }
        
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                role: user.role, 
                setores: user.setores.map(s => ({ id: s.id, nome: s.nome }))
            },
            config.SECRET_KEY,
            { expiresIn: config.JWT_EXPIRES_IN }
        );

        // Registrar / atualizar sessão do usuário
        try {
            // Finalizar sessões ativas anteriores do mesmo usuário
            await UserSession.update(
                { active: false, logoutAt: new Date() },
                { where: { username: user.username, active: true } }
            );

            // Criar nova sessão
            await UserSession.create({
                userId: user.id,
                username: user.username,
                ip: req.ip,
                userAgent: req.headers['user-agent'] || null,
                loginAt: new Date(),
                lastActivityAt: new Date(),
                active: true
            });
        } catch (sessionError) {
            console.error('Erro ao registrar sessão do usuário:', sessionError);
            // Não bloqueia o login se o log de sessão falhar
        }

        // Login bem-sucedido
        res.json({ token });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Rota para reset de senha (esqueci a senha)
router.post('/reset-password', async (req, res) => {
    const { username, newPassword } = req.body;

    if (!username || !newPassword) {
        return res.status(400).json({ error: 'Nome de usuário e nova senha são obrigatórios.' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' });
    }

    try {
        const user = await User.findOne({ where: { username } });
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }
        
        // Atualizar a senha
        user.password = newPassword; // O hook beforeUpdate cuidará da criptografia
        await user.save();
        
        res.status(200).json({ message: 'Senha alterada com sucesso. Você pode fazer login com a nova senha.' });
    } catch (error) {
        console.error('Erro ao resetar senha:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Rota para atualizar usuário (apenas admin)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const userId = req.params.id;
        const { username, role, setorIds, password } = req.body;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        // Atualizar dados básicos
        if (username) {
            // Verificar se o username já existe (exceto para o próprio usuário)
            const existingUser = await User.findOne({ 
                where: { 
                    username,
                    id: { [Op.ne]: userId }
                }
            });
            if (existingUser) {
                return res.status(400).json({ error: 'Nome de usuário já existe.' });
            }
            user.username = username;
        }

        if (role) {
            user.role = role;
        }

        // Atualizar senha se fornecida
        if (password && password.trim() !== '') {
            // Validar comprimento mínimo da senha
            if (password.length < config.MIN_PASSWORD_LENGTH) {
                return res.status(400).json({ 
                    error: `A senha deve ter pelo menos ${config.MIN_PASSWORD_LENGTH} caracteres.` 
                });
            }
            
            // Validar complexidade se necessário
            if (config.REQUIRE_PASSWORD_COMPLEXITY && !validatePasswordComplexity(password)) {
                return res.status(400).json({ 
                    error: 'Senha deve conter maiúsculas, minúsculas, números e caracteres especiais.' 
                });
            }
            
            // Atribuir a senha - o hook beforeUpdate fará o hash automaticamente
            user.password = password;
        }

        await user.save();

        // Atualizar setores se fornecido
        if (setorIds && Array.isArray(setorIds)) {
            // Remover todos os setores atuais
            await UserSetor.destroy({
                where: { userId: userId }
            });
            
            // Adicionar os novos setores
            if (setorIds.length > 0) {
                const setores = await Setor.findAll({
                    where: { id: setorIds }
                });
                
                const userSetorRecords = setores.map(setor => ({
                    userId: userId,
                    setorId: setor.id
                }));
                
                await UserSetor.bulkCreate(userSetorRecords);
            }
        }

        // Buscar usuário atualizado com setores
        const updatedUser = await User.findByPk(userId, {
            attributes: ['id', 'username', 'role'],
            include: [{
                model: Setor,
                as: 'setores',
                attributes: ['id', 'nome'],
                through: { attributes: [] }
            }]
        });

        res.status(200).json(updatedUser);
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Rota para obter informações do usuário logado (verificar se está autenticado)
router.get('/me', authMiddleware, async (req, res) => {
    try {
        res.status(200).json({
            id: req.user.id,
            username: req.user.username,
            role: req.user.role,
            setores: req.user.setores || [],
            setoresNomes: req.user.setoresNomes || [],
            lastAccess: req.user.lastAccess,
            ipAddress: req.user.ipAddress
        });
    } catch (error) {
        console.error('Erro ao obter usuário logado:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Rota de logout - encerra sessões ativas do usuário autenticado
router.post('/logout', authMiddleware, async (req, res) => {
    try {
        const username = req.user.username;

        await UserSession.update(
            { active: false, logoutAt: new Date() },
            { where: { username, active: true } }
        );

        res.status(200).json({ message: 'Logout realizado com sucesso.' });
    } catch (error) {
        console.error('Erro ao realizar logout:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Rota para listar sessões ativas (apenas admin)
router.get('/sessions/active', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        // Considerar apenas sessões ativas com atividade nos últimos 30 minutos
        const THIRTY_MINUTES_AGO = new Date(Date.now() - 30 * 60 * 1000);

        const sessions = await UserSession.findAll({
            where: { 
                active: true,
                lastActivityAt: { [Op.gte]: THIRTY_MINUTES_AGO }
            },
            order: [['lastActivityAt', 'DESC']]
        });

        res.status(200).json(sessions);
    } catch (error) {
        console.error('Erro ao listar sessões ativas:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Rota para excluir um usuário (apenas admin)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const userId = req.params.id;
        
        // Verificar se o usuário existe
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }
        
        // Verificar se não é o próprio usuário logado
        if (parseInt(userId) === req.user.id) {
            return res.status(400).json({ error: 'Você não pode excluir sua própria conta.' });
        }
        
        // Verificar se é o último administrador
        if (user.role === 'admin') {
            const adminCount = await User.count({ where: { role: 'admin' } });
            if (adminCount <= 1) {
                return res.status(400).json({ error: 'Não é possível excluir o último administrador do sistema.' });
            }
        }
        
        // Verificar se há tickets abertos ou em progresso atribuídos a este usuário
        const { Ticket } = require('../models');
        const ticketsAbertos = await Ticket.count({ 
            where: { 
                responsavel: user.username,
                status: {
                    [Op.in]: ['aberto', 'em progresso']
                }
            } 
        });
        
        if (ticketsAbertos > 0) {
            return res.status(400).json({ 
                error: `Não é possível excluir o usuário pois existem ${ticketsAbertos} ticket(s) aberto(s) ou em progresso atribuído(s) a ele. Feche ou reatribua os tickets antes de excluir o usuário.` 
            });
        }
        
        // Verificar se há tickets fechados (para informação)
        const ticketsFechados = await Ticket.count({ 
            where: { 
                responsavel: user.username,
                status: 'fechado'
            } 
        });
        
        // Excluir relacionamentos com setores
        await UserSetor.destroy({ where: { userId: userId } });
        
        // Excluir o usuário
        await user.destroy();
        
        // Mensagem de sucesso com informação sobre tickets fechados
        let message = 'Usuário excluído com sucesso.';
        if (ticketsFechados > 0) {
            message += ` ${ticketsFechados} ticket(s) fechado(s) foram encontrados e mantidos no histórico.`;
        }
        
        res.status(200).json({ message });
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Rota para atualizar a senha do usuário
router.put('/:id/change-password', authMiddleware, async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.params.id;

    if (req.user.id !== parseInt(userId)) {
        return res.status(403).json({ error: 'Você não tem permissão para alterar a senha de outro usuário.' });
    }

    try {
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }
        
        const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'A senha antiga está incorreta.' });
        }
        
        user.password = newPassword; // O hook beforeUpdate cuidará da criptografia
        await user.save();
        
        res.status(200).json({ message: 'Senha alterada com sucesso.' });
    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

module.exports = router;