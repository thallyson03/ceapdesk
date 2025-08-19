// scripts/backup-sqlite.js
const fs = require('fs');
const path = require('path');

const sourceDb = path.join(__dirname, '../database.sqlite');
const backupDir = path.join(__dirname, '../backups');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFile = path.join(backupDir, `database-backup-${timestamp}.sqlite`);

// Criar diretório de backup se não existir
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log('Diretório de backup criado.');
}

// Verificar se o banco SQLite existe
if (!fs.existsSync(sourceDb)) {
    console.error('Banco de dados SQLite não encontrado!');
    process.exit(1);
}

try {
    // Fazer backup do banco
    fs.copyFileSync(sourceDb, backupFile);
    
    // Verificar tamanho do arquivo
    const stats = fs.statSync(backupFile);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log('Backup criado com sucesso!');
    console.log(`Arquivo: ${backupFile}`);
    console.log(`Tamanho: ${fileSizeInMB} MB`);
    console.log(`Data: ${new Date().toLocaleString('pt-BR')}`);
    
    // Listar todos os backups
    const backups = fs.readdirSync(backupDir)
        .filter(file => file.endsWith('.sqlite'))
        .sort()
        .reverse();
    
    console.log('\nBackups disponíveis:');
    backups.forEach((backup, index) => {
        const backupPath = path.join(backupDir, backup);
        const backupStats = fs.statSync(backupPath);
        const backupSize = (backupStats.size / (1024 * 1024)).toFixed(2);
        const backupDate = backupStats.mtime.toLocaleString('pt-BR');
        
        console.log(`${index + 1}. ${backup} (${backupSize} MB) - ${backupDate}`);
    });
    
} catch (error) {
    console.error('Erro ao criar backup:', error.message);
    process.exit(1);
}






