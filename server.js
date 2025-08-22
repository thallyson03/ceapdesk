// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { sequelize, User, Setor } = require('./models/index');
const ticketsRoutes = require('./routes/tickets');
const usersRoutes = require('./routes/users');
const analyticsRoutes = require('./routes/analytics');
const setoresRoutes = require('./routes/setores');
const assuntosRoutes = require('./routes/assuntos');
const feriadosRoutes = require('./routes/feriados');
const reportsRoutes = require('./routes/reports');
const slaRoutes = require('./routes/sla');
const config = require('./config');

const app = express();
const PORT = config.PORT;

// 🔒 CONFIGURAÇÕES DE SEGURANÇA

// Middleware para forçar HTTPS apenas em produção com certificado válido
if (config.NODE_ENV === 'production' && config.FORCE_HTTPS === 'true') {
    app.use((req, res, next) => {
        // Verificar se a requisição veio via proxy (Nginx)
        const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
        
        if (!isSecure) {
            // Redirecionar para HTTPS
            const httpsUrl = `https://${req.headers.host}${req.url}`;
            return res.redirect(301, httpsUrl);
        }
        
        // Adicionar header HSTS para forçar HTTPS
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        
        next();
    });
    
    // Configurar cookies seguros em produção
    app.use((req, res, next) => {
        // Forçar cookies seguros em HTTPS
        res.cookie = function(name, value, options = {}) {
            options.secure = true;
            options.httpOnly = true;
            options.sameSite = 'strict';
            return res.cookie(name, value, options);
        };
        next();
    });
}

// Headers de segurança HTTP - Configuração mais flexível
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
            scriptSrcElem: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
            scriptSrcAttr: ["'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"]
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false
}));

// Rate limiting desabilitado - Sem limite de requisições
// const limiter = rateLimit({
//     windowMs: config.RATE_LIMIT_WINDOW_MS,
//     max: config.RATE_LIMIT_MAX_REQUESTS,
//     message: {
//         error: 'Muitas requisições. Tente novamente mais tarde.',
//         retryAfter: Math.ceil(config.RATE_LIMIT_WINDOW_MS / 1000)
//     },
//     standardHeaders: true,
//     legacyHeaders: false,
//     // Configuração para trabalhar com proxy (Nginx)
//     keyGenerator: (req) => {
//         return req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress;
//     },
//     skip: (req) => {
//         // Pular rate limiting para páginas HTML e recursos estáticos
//         return req.path.endsWith('.html') || 
//                req.path.endsWith('.css') || 
//                req.path.endsWith('.js') || 
//                req.path.endsWith('.ico') ||
//                req.path === '/' ||
//                req.path === '/health' || 
//                req.path === '/api/health' ||
//                req.path.startsWith('/api/v1/reports'); // Pular rate limiting para relatórios
//     }
// });
// app.use(limiter);

// Rate limiting específico para login desabilitado
// const loginLimiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutos
//     max: 5, // 5 tentativas
//     message: {
//         error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
//         retryAfter: 900
//     },
//     skipSuccessfulRequests: true,
//     // Configuração para trabalhar com proxy (Nginx)
//     keyGenerator: (req) => {
//         return req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress;
//     }
// });

// CORS configurado com origens específicas - Mais flexível
app.use(cors({
    origin: function (origin, callback) {
        // Permitir requisições sem origin (como mobile apps ou Postman)
        if (!origin) return callback(null, true);
        
        // Verificar se a origem está na lista de permitidas
        if (config.ALLOWED_ORIGINS.includes(origin) || 
            config.ALLOWED_ORIGINS.includes('*') ||
            origin.includes('localhost') ||
            origin.includes('127.0.0.1') ||
            origin.includes('129.146.176.225')) {
            return callback(null, true);
        }
        
        callback(new Error('Não permitido pelo CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware para remover headers sensíveis
app.use((req, res, next) => {
    res.removeHeader('X-Powered-By');
    next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware para tratar erros de parsing JSON
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error('❌ Erro de parsing JSON:', err.message);
        console.error('📝 Body recebido:', err.body);
        return res.status(400).json({ 
            error: 'JSON inválido',
            message: 'O corpo da requisição contém JSON malformado',
            details: err.message
        });
    }
    next(err);
});

app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting desabilitado para todas as rotas
// app.use('/api/v1/users/login', loginLimiter);

// Rotas da API
app.use('/api/v1/tickets', ticketsRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/setores', setoresRoutes);
app.use('/api/v1/assuntos', assuntosRoutes);
app.use('/api/v1/feriados', feriadosRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/sla', slaRoutes);
app.use('/api/v1/notifications', require('./routes/notifications'));

// Rotas para servir os arquivos HTML do frontend
app.get('/admin-user-create.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-user-create.html'));
});
app.get('/criar-setor.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'criar-setor.html'));
});
app.get('/gerenciar-setores.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'gerenciar-setores.html'));
});
app.get('/gerenciar-setores-usuario.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'gerenciar-setores-usuario.html'));
});
app.get('/gerenciar-tickets.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'gerenciar-tickets.html'));
});
app.get('/gerenciar-sla.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'gerenciar-sla.html'));
});
app.get('/analytics.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'analytics.html'));
});
app.get('/reports.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'reports.html'));
});
app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/dashboard-grafico.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard-grafico.html'));
});
app.get('/criar-ticket.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'criar-ticket.html'));
});
app.get('/change-password.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'change-password.html'));
});
app.get('/ticket-detalhes.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'ticket-detalhes.html'));
});
app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Rota para favicon
app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'favicon.ico'));
});

app.get('/favicon.svg', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'favicon.svg'));
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
    console.error('Erro não tratado:', err);
    res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: config.NODE_ENV === 'development' ? err.message : 'Algo deu errado'
    });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
});

// Sincroniza os modelos com o banco de dados e inicia o servidor
sequelize.sync({ force: false }).then(async () => {
    const existingAdmin = await User.findOne({ where: { username: 'admin' } });
    if (!existingAdmin) {
        // Usar senha da variável de ambiente ou gerar uma padrão
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        
        await User.create({
            username: 'admin',
            password: adminPassword, 
            role: 'admin',
            setor: 'Administração'
        });
        
        if (config.NODE_ENV === 'development') {
        }
    }
    
    const existingSetor = await Setor.findOne({ where: { nome: 'Administração' } });
    if (!existingSetor) {
        await Setor.create({ nome: 'Administração' });
    }

    app.listen(PORT, () => {
        // Servidor iniciado silenciosamente
    });
}).catch(err => {
    console.error('❌ Erro ao conectar com o banco de dados:', err);
    process.exit(1);
});