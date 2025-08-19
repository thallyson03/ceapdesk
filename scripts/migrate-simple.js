// scripts/migrate-simple.js
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

// Definir os modelos com tipos simples (sem ENUM)
const User = postgresSequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    role: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    setor: {
        type: DataTypes.STRING(255),
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
        type: DataTypes.STRING(255),
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
        type: DataTypes.STRING(255),
        allowNull: false
    },
    descricao: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    status: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: 'aberto'
    },
    prioridade: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: 'media'
    },
    setor: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: 'Geral'
    },
    solicitante: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: 'Usuário'
    },
    responsavel: {
        type: DataTypes.STRING(255),
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
        type: DataTypes.STRING(255),
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
        type: DataTypes.STRING(255),
        allowNull: false
    },
    usuario: {
        type: DataTypes.STRING(255),
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
        type: DataTypes.STRING(255),
        allowNull: false
    },
    valorAnterior: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    valorNovo: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    usuario: {
        type: DataTypes.STRING(255),
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

// Função para limpar e validar dados
function cleanData(data) {
    const cleaned = {};
    
    for (const [key, value] of Object.entries(data)) {
        if (value === null || value === undefined || value === '') {
            // Definir valores padrão para campos obrigatórios
            switch (key) {
                // Campos da tabela Users
                case 'username':
                    cleaned[key] = 'usuario_' + (data.id || Date.now());
                    break;
                case 'password':
                    cleaned[key] = 'senha_padrao';
                    break;
                case 'role':
                    cleaned[key] = 'user';
                    break;
                case 'setor':
                    cleaned[key] = 'Geral';
                    break;
                
                // Campos da tabela Setors
                case 'nome':
                    cleaned[key] = 'Setor_' + (data.id || Date.now());
                    break;
                
                // Campos da tabela Tickets
                case 'titulo':
                    cleaned[key] = 'Título não informado';
                    break;
                case 'descricao':
                    cleaned[key] = 'Descrição não informada';
                    break;
                case 'status':
                    cleaned[key] = 'aberto';
                    break;
                case 'prioridade':
                    cleaned[key] = 'media';
                    break;
                case 'solicitante':
                    cleaned[key] = 'Usuário';
                    break;
                
                // Campos da tabela Anotacaos
                case 'ticketId':
                    cleaned[key] = 1; // Valor padrão, mas será tratado separadamente
                    break;
                case 'conteudo':
                    cleaned[key] = 'Anotação sem conteúdo';
                    break;
                case 'autor':
                    cleaned[key] = 'Sistema';
                    break;
                
                // Campos da tabela historicoTickets
                case 'alteracao':
                    cleaned[key] = 'Alteração não especificada';
                    break;
                case 'usuario':
                    cleaned[key] = 'Sistema';
                    break;
                case 'dataAlteracao':
                    cleaned[key] = new Date();
                    break;
                
                // Campos da tabela RegistroDeAlteracaos
                case 'campo':
                    cleaned[key] = 'campo_nao_especificado';
                    break;
                case 'valorAnterior':
                    cleaned[key] = 'não informado';
                    break;
                case 'valorNovo':
                    cleaned[key] = 'não informado';
                    break;
                case 'dataAlteracao':
                    cleaned[key] = new Date();
                    break;
                
                default:
                    cleaned[key] = value;
            }
        } else {
            cleaned[key] = value;
        }
    }
    
    return cleaned;
}

// Função para migrar dados
async function migrateData() {
    try {
        console.log('🚀 Iniciando migração simplificada...\n');
        
        // Testar conexão com PostgreSQL
        await postgresSequelize.authenticate();
        console.log('✅ Conexão com PostgreSQL estabelecida com sucesso.');
        
        // Sincronizar modelos com PostgreSQL (force: true para recriar tabelas)
        console.log('🔄 Criando tabelas no PostgreSQL...');
        await postgresSequelize.sync({ force: true });
        console.log('✅ Tabelas criadas no PostgreSQL.');
        
        // Migrar dados do SQLite para PostgreSQL
        console.log('\n📤 Iniciando migração de dados...');
        
        await migrateUsers();
        await migrateSetores();
        await migrateTickets();
        await migrateAnotacoes();
        await migrateHistoricoTickets();
        await migrateRegistrosAlteracao();
        
        console.log('\n🎉 Migração concluída com sucesso!');
        console.log('✅ Sistema pronto para uso!');
        process.exit(0);
        
    } catch (error) {
        console.error('\n❌ Erro durante a migração:', error);
        process.exit(1);
    } finally {
        sqliteDb.close();
        await postgresSequelize.close();
    }
}

// Migrar usuários
async function migrateUsers() {
    return new Promise((resolve, reject) => {
        sqliteDb.all("SELECT * FROM Users", async (err, rows) => {
            if (err) {
                console.log('  ⚠️  Tabela Users não encontrada ou vazia');
                resolve();
                return;
            }
            
            try {
                let migratedCount = 0;
                let errorCount = 0;
                
                for (const row of rows) {
                    try {
                        const cleanedData = cleanData(row);
                        
                        // Remover ID para permitir auto-incremento
                        delete cleanedData.id;
                        
                        // Log para debug
                        if (cleanedData.username.includes('usuario_') || cleanedData.password === 'senha_padrao' || cleanedData.role === 'user' || cleanedData.setor === 'Geral') {
                            console.log(`  ⚠️  Usuário ${row.id}: usando valores padrão para campos obrigatórios`);
                        }
                        
                        await User.create(cleanedData);
                        migratedCount++;
                    } catch (createError) {
                        console.error(`  ❌ Erro ao migrar usuário ${row.id}:`, createError.message);
                        errorCount++;
                    }
                }
                
                if (errorCount > 0) {
                    console.log(`  ⚠️  ${errorCount} usuários com erro, ${migratedCount} migrados com sucesso`);
                } else {
                    console.log(`  ✅ ${migratedCount} usuários migrados.`);
                }
                resolve();
            } catch (error) {
                console.error(`  ❌ Erro ao migrar usuários:`, error.message);
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
                console.log('  ⚠️  Tabela Setors não encontrada ou vazia');
                resolve();
                return;
            }
            
            try {
                let migratedCount = 0;
                let errorCount = 0;
                
                for (const row of rows) {
                    try {
                        const cleanedData = cleanData(row);
                        
                        // Remover ID para permitir auto-incremento
                        delete cleanedData.id;
                        
                        // Log para debug
                        if (cleanedData.nome.includes('Setor_')) {
                            console.log(`  ⚠️  Setor ${row.id}: usando valores padrão para campos obrigatórios`);
                        }
                        
                        await Setor.create(cleanedData);
                        migratedCount++;
                    } catch (createError) {
                        console.error(`  ❌ Erro ao migrar setor ${row.id}:`, createError.message);
                        errorCount++;
                    }
                }
                
                if (errorCount > 0) {
                    console.log(`  ⚠️  ${errorCount} setores com erro, ${migratedCount} migrados com sucesso`);
                } else {
                    console.log(`  ✅ ${migratedCount} setores migrados.`);
                }
                resolve();
            } catch (error) {
                console.error(`  ❌ Erro ao migrar setores:`, error.message);
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
                console.log('  ⚠️  Tabela Tickets não encontrada ou vazia');
                resolve();
                return;
            }
            
            try {
                let migratedCount = 0;
                let errorCount = 0;
                
                for (const row of rows) {
                    try {
                        const cleanedData = cleanData(row);
                        
                        // Remover ID para permitir auto-incremento
                        delete cleanedData.id;
                        
                        // Log para debug
                        if (cleanedData.setor === 'Geral' || cleanedData.solicitante === 'Usuário') {
                            console.log(`  ⚠️  Ticket ${row.id}: usando valores padrão para campos obrigatórios`);
                        }
                        
                        await Ticket.create(cleanedData);
                        migratedCount++;
                    } catch (createError) {
                        console.error(`  ❌ Erro ao migrar ticket ${row.id}:`, createError.message);
                        errorCount++;
                    }
                }
                
                if (errorCount > 0) {
                    console.log(`  ⚠️  ${errorCount} tickets com erro, ${migratedCount} migrados com sucesso`);
                } else {
                    console.log(`  ✅ ${migratedCount} tickets migrados.`);
                }
                resolve();
            } catch (error) {
                console.error(`  ❌ Erro ao migrar tickets:`, error.message);
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
                console.log('  ⚠️  Tabela Anotacaos não encontrada ou vazia');
                resolve();
                return;
            }
            
            try {
                let migratedCount = 0;
                let errorCount = 0;
                
                for (const row of rows) {
                    try {
                        // Mapear campos da estrutura SQLite para a estrutura PostgreSQL
                        const cleanedData = {
                            id: row.id,
                            ticketId: row.TicketId || 1, // Campo TicketId do SQLite
                            conteudo: row.texto || 'Anotação sem conteúdo', // Campo texto do SQLite
                            autor: row.usuarioCriador || 'Sistema', // Campo usuarioCriador do SQLite
                            createdAt: row.createdAt,
                            updatedAt: row.updatedAt
                        };
                        
                        // Remover ID para permitir auto-incremento
                        delete cleanedData.id;
                        
                        // Log para debug
                        if (cleanedData.ticketId === 1 || cleanedData.conteudo === 'Anotação sem conteúdo' || cleanedData.autor === 'Sistema') {
                            console.log(`  ⚠️  Anotação ${row.id}: usando valores padrão para campos obrigatórios`);
                        }
                        
                        await Anotacao.create(cleanedData);
                        migratedCount++;
                    } catch (createError) {
                        console.error(`  ❌ Erro ao migrar anotação ${row.id}:`, createError.message);
                        errorCount++;
                    }
                }
                
                if (errorCount > 0) {
                    console.log(`  ⚠️  ${errorCount} anotações com erro, ${migratedCount} migradas com sucesso`);
                } else {
                    console.log(`  ✅ ${migratedCount} anotações migradas.`);
                }
                resolve();
            } catch (error) {
                console.error(`  ❌ Erro ao migrar anotações:`, error.message);
                reject(error);
            }
        });
    });
}

// Migrar histórico de tickets
async function migrateHistoricoTickets() {
    return new Promise((resolve, reject) => {
        sqliteDb.all("SELECT * FROM HistoricoTickets", async (err, rows) => {
            if (err) {
                console.log('  ⚠️  Tabela HistoricoTickets não encontrada ou vazia');
                resolve();
                return;
            }
            
            try {
                let migratedCount = 0;
                let errorCount = 0;
                
                for (const row of rows) {
                    try {
                        // Mapear campos da estrutura SQLite para a estrutura PostgreSQL
                        const cleanedData = {
                            id: row.id,
                            ticketId: row.TicketId || 1, // Campo TicketId do SQLite
                            alteracao: row.campoAlterado || 'Alteração não especificada', // Campo campoAlterado do SQLite
                            usuario: row.responsavelPelaAlteracao || 'Sistema', // Campo responsavelPelaAlteracao do SQLite
                            dataAlteracao: row.createdAt || new Date(), // Usar createdAt como dataAlteracao
                            createdAt: row.createdAt,
                            updatedAt: row.updatedAt
                        };
                        
                        // Remover ID para permitir auto-incremento
                        delete cleanedData.id;
                        
                        // Log para debug
                        if (cleanedData.ticketId === 1 || cleanedData.alteracao === 'Alteração não especificada' || cleanedData.usuario === 'Sistema') {
                            console.log(`  ⚠️  Histórico ${row.id}: usando valores padrão para campos obrigatórios`);
                        }
                        
                        await historicoTicket.create(cleanedData);
                        migratedCount++;
                    } catch (createError) {
                        console.error(`  ❌ Erro ao migrar histórico ${row.id}:`, createError.message);
                        errorCount++;
                    }
                }
                
                if (errorCount > 0) {
                    console.log(`  ⚠️  ${errorCount} registros de histórico com erro, ${migratedCount} migrados com sucesso`);
                } else {
                    console.log(`  ✅ ${migratedCount} registros de histórico migrados.`);
                }
                resolve();
            } catch (error) {
                console.error(`  ❌ Erro ao migrar histórico:`, error.message);
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
                console.log('  ⚠️  Tabela RegistroDeAlteracaos não encontrada ou vazia');
                resolve();
                return;
            }
            
            try {
                let migratedCount = 0;
                let errorCount = 0;
                
                for (const row of rows) {
                    try {
                        const cleanedData = cleanData(row);
                        
                        // Remover ID para permitir auto-incremento
                        delete cleanedData.id;
                        
                        // Log para debug
                        if (cleanedData.campo === 'campo_nao_especificado' || cleanedData.usuario === 'Sistema') {
                            console.log(`  ⚠️  Registro ${row.id}: usando valores padrão para campos obrigatórios`);
                        }
                        
                        await RegistroDeAlteracao.create(cleanedData);
                        migratedCount++;
                    } catch (createError) {
                        console.error(`  ❌ Erro ao migrar registro ${row.id}:`, createError.message);
                        errorCount++;
                    }
                }
                
                if (errorCount > 0) {
                    console.log(`  ⚠️  ${errorCount} registros de alteração com erro, ${migratedCount} migrados com sucesso`);
                } else {
                    console.log(`  ✅ ${migratedCount} registros de alteração migrados.`);
                }
                resolve();
            } catch (error) {
                console.error(`  ❌ Erro ao migrar registros de alteração:`, error.message);
                reject(error);
            }
        });
    });
}

// Executar migração
migrateData();
