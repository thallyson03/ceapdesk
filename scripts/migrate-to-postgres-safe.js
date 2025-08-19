// scripts/migrate-to-postgres-safe.js
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

// Função para verificar se uma tabela existe no SQLite
function tableExists(tableName) {
    return new Promise((resolve) => {
        sqliteDb.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`, (err, row) => {
            resolve(!!row);
        });
    });
}

// Função para contar registros em uma tabela
function countRecords(tableName) {
    return new Promise((resolve) => {
        sqliteDb.get(`SELECT COUNT(*) as count FROM "${tableName}"`, (err, result) => {
            resolve(err ? 0 : result.count);
        });
    });
}

// Função para migrar dados
async function migrateData() {
    try {
        console.log('🚀 Iniciando migração segura de dados...\n');
        
        // Testar conexão com PostgreSQL
        await postgresSequelize.authenticate();
        console.log('✅ Conexão com PostgreSQL estabelecida com sucesso.');
        
        // Verificar tabelas no SQLite
        console.log('🔍 Verificando tabelas no SQLite...');
        const tablesToMigrate = [
            { name: 'Users', model: User, exists: false, count: 0 },
            { name: 'Setors', model: Setor, exists: false, count: 0 },
            { name: 'Tickets', model: Ticket, exists: false, count: 0 },
            { name: 'Anotacaos', model: Anotacao, exists: false, count: 0 },
            { name: 'historicoTickets', model: historicoTicket, exists: false, count: 0 },
            { name: 'RegistroDeAlteracaos', model: RegistroDeAlteracao, exists: false, count: 0 }
        ];
        
        for (const table of tablesToMigrate) {
            table.exists = await tableExists(table.name);
            if (table.exists) {
                table.count = await countRecords(table.name);
                console.log(`  📋 ${table.name}: ${table.count} registros encontrados`);
            } else {
                console.log(`  ❌ ${table.name}: tabela não encontrada`);
            }
        }
        
        // Sincronizar modelos com PostgreSQL
        console.log('\n🔄 Criando tabelas no PostgreSQL...');
        await postgresSequelize.sync({ force: true });
        console.log('✅ Tabelas criadas no PostgreSQL.');
        
        // Migrar dados das tabelas que existem
        console.log('\n📤 Iniciando migração de dados...');
        
        for (const table of tablesToMigrate) {
            if (table.exists && table.count > 0) {
                console.log(`\n🔄 Migrando ${table.name}...`);
                await migrateTable(table.name, table.model);
            } else if (table.exists) {
                console.log(`\n⏭️  ${table.name}: tabela vazia, pulando...`);
            } else {
                console.log(`\n⏭️  ${table.name}: tabela não existe, pulando...`);
            }
        }
        
        console.log('\n🎉 Migração concluída com sucesso!');
        process.exit(0);
        
    } catch (error) {
        console.error('\n❌ Erro durante a migração:', error);
        process.exit(1);
    } finally {
        sqliteDb.close();
        await postgresSequelize.close();
    }
}

// Função para migrar uma tabela específica
async function migrateTable(tableName, model) {
    return new Promise((resolve, reject) => {
        sqliteDb.all(`SELECT * FROM "${tableName}"`, async (err, rows) => {
            if (err) {
                console.error(`  ❌ Erro ao ler ${tableName}:`, err.message);
                reject(err);
                return;
            }
            
            try {
                let migratedCount = 0;
                for (const row of rows) {
                    try {
                        await model.create(row);
                        migratedCount++;
                    } catch (createError) {
                        console.error(`  ⚠️  Erro ao migrar registro ${row.id}:`, createError.message);
                    }
                }
                console.log(`  ✅ ${migratedCount}/${rows.length} registros migrados de ${tableName}`);
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    });
}

// Executar migração
migrateData();






