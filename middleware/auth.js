const jwt = require('jsonwebtoken');
const config = require('../config');

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        // Log de tentativa de acesso sem token
        console.warn(`🚨 Tentativa de acesso sem token - IP: ${req.ip} - Rota: ${req.path}`);
        return res.status(401).json({ error: 'Token não fornecido.' });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
        console.warn(`🚨 Token malformado - IP: ${req.ip} - Rota: ${req.path}`);
        return res.status(401).json({ error: 'Formato de token inválido.' });
    }

    try {
        const user = jwt.verify(token, config.SECRET_KEY);
        
        // Validações adicionais de segurança
        if (!user.id || !user.username || !user.role) {
            console.warn(`🚨 Token com dados incompletos - IP: ${req.ip} - Usuario: ${user.username || 'desconhecido'}`);
            return res.status(401).json({ error: 'Token inválido - dados incompletos.' });
        }
        
        // Verificar se o token não expirou
        if (user.exp && Date.now() >= user.exp * 1000) {
            console.warn(`🚨 Token expirado - IP: ${req.ip} - Usuario: ${user.username}`);
            return res.status(401).json({ error: 'Token expirado.' });
        }
        
        // Adicionar campo virtual 'setor' baseado no primeiro setor (para compatibilidade)
        if (user.setores && user.setores.length > 0) {
            user.setor = user.setores[0].nome;
        } else {
            user.setor = 'Geral'; // Setor padrão
        }
        
        // Adicionar lista de todos os setores do usuário
        user.setoresNomes = user.setores ? user.setores.map(s => s.nome) : ['Geral'];
        
        // Adicionar informações de auditoria
        user.lastAccess = new Date();
        user.ipAddress = req.ip;
        
        req.user = user;
        
        // Log de acesso bem-sucedido (apenas para rotas sensíveis)
        if (req.path.includes('/admin') || req.path.includes('/reports') || req.path.includes('/analytics')) {
            console.log(`✅ Acesso autorizado - Usuario: ${user.username} - Role: ${user.role} - Rota: ${req.path} - IP: ${req.ip}`);
        }
        
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            console.warn(`🚨 Token expirado - IP: ${req.ip} - Rota: ${req.path}`);
            return res.status(401).json({ error: 'Token expirado.' });
        }
        
        if (error.name === 'JsonWebTokenError') {
            console.warn(`🚨 Token inválido - IP: ${req.ip} - Rota: ${req.path} - Erro: ${error.message}`);
            return res.status(401).json({ error: 'Token inválido.' });
        }
        
        console.error(`❌ Erro na verificação do token - IP: ${req.ip} - Rota: ${req.path} - Erro: ${error.message}`);
        res.status(401).json({ error: 'Token inválido.' });
    }
};

// Middleware para verificar se o usuário é admin
const adminMiddleware = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado.' });
    }
    
    if (req.user.role !== 'admin') {
        console.warn(`🚨 Tentativa de acesso admin negada - Usuario: ${req.user.username} - Role: ${req.user.role} - IP: ${req.ip} - Rota: ${req.path}`);
        return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem acessar este recurso.' });
    }
    
    next();
};

// Middleware para verificar permissões de setor
const setorMiddleware = (setorRequired) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Usuário não autenticado.' });
        }
        
        // Admins têm acesso a todos os setores
        if (req.user.role === 'admin') {
            return next();
        }
        
        // Verificar se o usuário tem acesso ao setor
        const hasSetor = req.user.setoresNomes && req.user.setoresNomes.includes(setorRequired);
        
        if (!hasSetor) {
            console.warn(`🚨 Acesso negado ao setor ${setorRequired} - Usuario: ${req.user.username} - Setores: ${req.user.setoresNomes.join(', ')} - IP: ${req.ip}`);
            return res.status(403).json({ error: `Acesso negado ao setor ${setorRequired}.` });
        }
        
        next();
    };
};

module.exports = {
    authMiddleware,
    adminMiddleware,
    setorMiddleware
};