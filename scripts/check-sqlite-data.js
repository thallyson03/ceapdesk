// scripts/check-sqlite-data.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const sqliteDb = new sqlite3.Database(path.join(__dirname, '../database.sqlite'));

function checkData() {
    console.log('🔍 Verificando qualidade dos dados no SQLite...\n');
    
    // Verificar tabela Users
    console.log('👥 Verificando tabela Users...');
    sqliteDb.all("SELECT * FROM Users", (err, rows) => {
        if (err) {
            console.log('  ❌ Tabela Users não encontrada');
        } else {
            console.log(`  📊 Total de usuários: ${rows.length}`);
            
            // Verificar campos obrigatórios
            const nullFields = rows.filter(row => 
                !row.username || !row.password || !row.role || !row.setor
            );
            
            if (nullFields.length > 0) {
                console.log(`  ⚠️  ${nullFields.length} usuários com campos obrigatórios nulos:`);
                nullFields.forEach(user => {
                    console.log(`    ID ${user.id}: username=${user.username}, role=${user.role}, setor=${user.setor}`);
                });
            } else {
                console.log('  ✅ Todos os usuários têm campos obrigatórios preenchidos');
            }
        }
        
        // Verificar tabela Setors
        console.log('\n🏢 Verificando tabela Setors...');
        sqliteDb.all("SELECT * FROM Setors", (err, rows) => {
            if (err) {
                console.log('  ❌ Tabela Setors não encontrada');
            } else {
                console.log(`  📊 Total de setores: ${rows.length}`);
                
                const nullFields = rows.filter(row => !row.nome);
                if (nullFields.length > 0) {
                    console.log(`  ⚠️  ${nullFields.length} setores com nome nulo`);
                } else {
                    console.log('  ✅ Todos os setores têm nome preenchido');
                }
            }
            
            // Verificar tabela Tickets
            console.log('\n🎫 Verificando tabela Tickets...');
            sqliteDb.all("SELECT * FROM Tickets", (err, rows) => {
                if (err) {
                    console.log('  ❌ Tabela Tickets não encontrada');
                } else {
                    console.log(`  📊 Total de tickets: ${rows.length}`);
                    
                    // Verificar campos obrigatórios
                    const nullFields = rows.filter(row => 
                        !row.titulo || !row.descricao || !row.status || 
                        !row.prioridade || !row.setor || !row.solicitante
                    );
                    
                    if (nullFields.length > 0) {
                        console.log(`  ⚠️  ${nullFields.length} tickets com campos obrigatórios nulos:`);
                        nullFields.forEach(ticket => {
                            console.log(`    ID ${ticket.id}:`);
                            console.log(`      titulo: ${ticket.titulo || 'NULL'}`);
                            console.log(`      descricao: ${ticket.descricao || 'NULL'}`);
                            console.log(`      status: ${ticket.status || 'NULL'}`);
                            console.log(`      prioridade: ${ticket.prioridade || 'NULL'}`);
                            console.log(`      setor: ${ticket.setor || 'NULL'}`);
                            console.log(`      solicitante: ${ticket.solicitante || 'NULL'}`);
                        });
                    } else {
                        console.log('  ✅ Todos os tickets têm campos obrigatórios preenchidos');
                    }
                    
                    // Verificar valores específicos
                    const emptySetor = rows.filter(row => row.setor === '' || row.setor === null);
                    const emptySolicitante = rows.filter(row => row.solicitante === '' || row.solicitante === null);
                    
                    if (emptySetor.length > 0) {
                        console.log(`  ⚠️  ${emptySetor.length} tickets com setor vazio/nulo`);
                    }
                    
                    if (emptySolicitante.length > 0) {
                        console.log(`  ⚠️  ${emptySolicitante.length} tickets com solicitante vazio/nulo`);
                    }
                }
                
                // Verificar outras tabelas
                checkOtherTables();
            });
        });
    });
}

function checkOtherTables() {
    console.log('\n📝 Verificando outras tabelas...');
    
    // Verificar Anotacaos
    sqliteDb.all("SELECT * FROM Anotacaos", (err, rows) => {
        if (err) {
            console.log('  ❌ Tabela Anotacaos não encontrada');
        } else {
            console.log(`  📊 Total de anotações: ${rows.length}`);
            
            const nullFields = rows.filter(row => 
                !row.ticketId || !row.conteudo || !row.autor
            );
            
            if (nullFields.length > 0) {
                console.log(`  ⚠️  ${nullFields.length} anotações com campos obrigatórios nulos`);
            }
        }
        
        // Verificar historicoTickets
        sqliteDb.all("SELECT * FROM historicoTickets", (err, rows) => {
            if (err) {
                console.log('  ❌ Tabela historicoTickets não encontrada');
            } else {
                console.log(`  📊 Total de registros de histórico: ${rows.length}`);
                
                const nullFields = rows.filter(row => 
                    !row.ticketId || !row.alteracao || !row.usuario
                );
                
                if (nullFields.length > 0) {
                    console.log(`  ⚠️  ${nullFields.length} registros com campos obrigatórios nulos`);
                }
            }
            
            // Verificar RegistroDeAlteracaos
            sqliteDb.all("SELECT * FROM RegistroDeAlteracaos", (err, rows) => {
                if (err) {
                    console.log('  ❌ Tabela RegistroDeAlteracaos não encontrada');
                } else {
                    console.log(`  📊 Total de registros de alteração: ${rows.length}`);
                    
                    const nullFields = rows.filter(row => 
                        !row.ticketId || !row.campo || !row.usuario
                    );
                    
                    if (nullFields.length > 0) {
                        console.log(`  ⚠️  ${nullFields.length} registros com campos obrigatórios nulos`);
                    }
                }
                
                // Resumo final
                console.log('\n📋 RESUMO DA VERIFICAÇÃO:');
                console.log('✅ Use este script para identificar problemas antes da migração');
                console.log('⚠️  Campos nulos serão preenchidos com valores padrão durante a migração');
                console.log('🔧 Execute npm run migrate:simple para migração com tratamento de dados');
                
                // Fechar conexão
                setTimeout(() => {
                    sqliteDb.close();
                    console.log('\n🔌 Conexão com SQLite fechada.');
                }, 1000);
            });
        });
    });
}

// Executar verificação
checkData();






