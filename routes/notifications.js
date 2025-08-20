const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const notificationService = require('../services/notificationService');

// Rota para verificar status do serviço de notificação (apenas admin)
router.get('/status', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const status = await notificationService.checkEmailServiceStatus();
        res.status(200).json(status);
    } catch (error) {
        console.error('Erro ao verificar status:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});



// Rota para buscar usuários de um setor (apenas admin)
router.get('/setor/:setorNome', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { setorNome } = req.params;
        const users = await notificationService.getUsersBySetor(setorNome);
        
        res.status(200).json({
            setor: setorNome,
            totalUsers: users.length,
            usersWithEmail: users.filter(user => user.email).length,
            users: users.map(user => ({
                id: user.id,
                username: user.username,
                email: user.email
            }))
        });
    } catch (error) {
        console.error('Erro ao buscar usuários do setor:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

module.exports = router;
