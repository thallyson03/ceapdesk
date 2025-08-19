// scripts/migrate-to-postgres.js
const sqlite3 = require('sqlite3').verbose();
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const config = require('../config/database');

// Configuração do banco SQLite (origem)
const sqliteDb = new sqlite3.Database(path.join(__dirname, '../database.sqlite'));

// Configuração do PostgreSQL (destino)
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const postgresSequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: dbConfig.dialect,
        logging: false
    }
);

// Definir os modelos manualmente para a migração
const User = postgresSequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.STRING,
        allowNull: false
    },
    setor: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'Users',
    timestamps: true
});

const Setor = postgresSequelize.define('Setor', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nome: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    }
}, {
    tableName: 'Setors',
    timestamps: true
});

const Ticket = postgresSequelize.define('Ticket', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    titulo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    descricao: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false
    },
    prioridade: {
        type: DataTypes.STRING,
        allowNull: false
    },
    setor: {
        type: DataTypes.STRING,
        allowNull: false
    },
    solicitante: {
        type: DataTypes.STRING,
        allowNull: false
    },
    responsavel: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'Tickets',
    timestamps: true
});

const Anotacao = postgresSequelize.define('Anotacao', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    ticketId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    conteudo: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    autor: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'Anotacaos',
    timestamps: true
});

const historicoTicket = postgresSequelize.define('historicoTicket', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    ticketId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    alteracao: {
        type: DataTypes.STRING,
        allowNull: false
    },
    usuario: {
        type: DataTypes.STRING,
        allowNull: false
    },
    dataAlteracao: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    tableName: 'historicoTickets',
    timestamps: true
});

const RegistroDeAlteracao = postgresSequelize.define('RegistroDeAlteracao', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    ticketId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    campo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    valorAnterior: {
        type: DataTypes.STRING,
        allowNull: true
    },
    valorNovo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    usuario: {
        type: DataTypes.STRING,
        allowNull: false
    },
    dataAlteracao: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    tableName: 'RegistroDeAlteracaos',
    timestamps: true
});

// Função para migrar dados
async function migrateData() {
    try {
        console.log('Iniciando migração de dados...');
        
        // Testar conexão com PostgreSQL
        await postgresSequelize.authenticate();
        console.log('Conexão com PostgreSQL estabelecida com sucesso.');
        
        // Sincronizar modelos com PostgreSQL
        await postgresSequelize.sync({ force: true });
        console.log('Tabelas criadas no PostgreSQL.');
        
        // Migrar dados do SQLite para PostgreSQL
        await migrateUsers();
        await migrateSetores();
        await migrateTickets();
        await migrateAnotacoes();
        await migrateHistoricoTickets();
        await migrateRegistrosAlteracao();
        
        console.log('Migração concluída com sucesso!');
        process.exit(0);
        
    } catch (error) {
        console.error('Erro durante a migração:', error);
        process.exit(1);
    }
}

// Migrar usuários
async function migrateUsers() {
    return new Promise((resolve, reject) => {
        sqliteDb.all("SELECT * FROM Users", async (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            
            try {
                for (const row of rows) {
                    await User.create({
                        id: row.id,
                        username: row.username,
                        password: row.password,
                        role: row.role,
                        setor: row.setor,
                        createdAt: row.createdAt,
                        updatedAt: row.updatedAt
                    });
                }
                console.log(`${rows.length} usuários migrados.`);
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    });
}

// Migrar setores
async function migrateSetores() {
    return new Promise((resolve, reject) => {
        sqliteDb.all("SELECT * FROM Setors", async (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            
            try {
                for (const row of rows) {
                    await Setor.create({
                        id: row.id,
                        nome: row.nome,
                        createdAt: row.createdAt,
                        updatedAt: row.updatedAt
                    });
                }
                console.log(`${rows.length} setores migrados.`);
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    });
}

// Migrar tickets
async function migrateTickets() {
    return new Promise((resolve, reject) => {
        sqliteDb.all("SELECT * FROM Tickets", async (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            
            try {
                for (const row of rows) {
                    await Ticket.create({
                        id: row.id,
                        titulo: row.titulo,
                        descricao: row.descricao,
                        status: row.status,
                        prioridade: row.prioridade,
                        setor: row.setor,
                        solicitante: row.solicitante,
                        responsavel: row.responsavel,
                        createdAt: row.createdAt,
                        updatedAt: row.updatedAt
                    });
                }
                console.log(`${rows.length} tickets migrados.`);
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    });
}

// Migrar anotações
async function migrateAnotacoes() {
    return new Promise((resolve, reject) => {
        sqliteDb.all("SELECT * FROM Anotacaos", async (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            
            try {
                for (const row of rows) {
                    await Anotacao.create({
                        id: row.id,
                        ticketId: row.ticketId,
                        conteudo: row.conteudo,
                        autor: row.autor,
                        createdAt: row.createdAt,
                        updatedAt: row.updatedAt
                    });
                }
                console.log(`${rows.length} anotações migradas.`);
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    });
}

// Migrar histórico de tickets
async function migrateHistoricoTickets() {
    return new Promise((resolve, reject) => {
        sqliteDb.all("SELECT * FROM historicoTickets", async (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            
            try {
                for (const row of rows) {
                    await historicoTicket.create({
                        id: row.id,
                        ticketId: row.ticketId,
                        alteracao: row.alteracao,
                        usuario: row.usuario,
                        dataAlteracao: row.dataAlteracao,
                        createdAt: row.createdAt,
                        updatedAt: row.updatedAt
                    });
                }
                console.log(`${rows.length} registros de histórico migrados.`);
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    });
}

// Migrar registros de alteração
async function migrateRegistrosAlteracao() {
    return new Promise((resolve, reject) => {
        sqliteDb.all("SELECT * FROM RegistroDeAlteracaos", async (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            
            try {
                for (const row of rows) {
                    await RegistroDeAlteracao.create({
                        id: row.id,
                        ticketId: row.ticketId,
                        campo: row.campo,
                        valorAnterior: row.valorAnterior,
                        valorNovo: row.valorNovo,
                        usuario: row.usuario,
                        dataAlteracao: row.dataAlteracao,
                        createdAt: row.createdAt,
                        updatedAt: row.updatedAt
                    });
                }
                console.log(`${rows.length} registros de alteração migrados.`);
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    });
}

// Executar migração
migrateData();
