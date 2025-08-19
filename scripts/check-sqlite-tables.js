// scripts/check-sqlite-tables.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const sqliteDb = new sqlite3.Database(path.join(__dirname, '../database.sqlite'));

function checkTables() {
    console.log('🔍 Verificando tabelas no banco SQLite...\n');
    
    // Listar todas as tabelas
    sqliteDb.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
        if (err) {
            console.error('❌ Erro ao listar tabelas:', err.message);
            process.exit(1);
        }
        
        console.log('📋 Tabelas encontradas:');
        tables.forEach((table, index) => {
            console.log(`  ${index + 1}. ${table.name}`);
        });
        
        console.log(`\n📊 Total de tabelas: ${tables.length}`);
        
        // Verificar dados em cada tabela
        tables.forEach(table => {
            sqliteDb.get(`SELECT COUNT(*) as count FROM "${table.name}"`, (err, result) => {
                if (err) {
                    console.log(`  ❌ Erro ao contar registros em ${table.name}: ${err.message}`);
                } else {
                    console.log(`  📝 ${table.name}: ${result.count} registros`);
                }
            });
        });
        
        // Fechar conexão após um tempo para permitir que as consultas terminem
        setTimeout(() => {
            sqliteDb.close();
            console.log('\n🔌 Conexão com SQLite fechada.');
        }, 2000);
    });
}

// Executar verificação
checkTables();






