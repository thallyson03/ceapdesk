// scripts/add-default-holidays.js
const { Sequelize } = require('sequelize');
const config = require('../config/database');
const SLAService = require('../services/slaService');

async function addDefaultHolidays() {
    // Usar configuração de desenvolvimento por padrão
    const dbConfig = config.development;
    
    const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: dbConfig.dialect,
        logging: false,
        define: dbConfig.define,
        pool: dbConfig.pool
    });

    try {
        console.log('🔧 Adicionando feriados padrão do Brasil...');
        
        const currentYear = new Date().getFullYear();
        const nextYear = currentYear + 1;
        
        console.log(`📅 Adicionando feriados para ${currentYear} e ${nextYear}...`);
        
        // Adicionar feriados para o ano atual
        const feriadosAtuais = await SLAService.addDefaultBrazilianHolidays(currentYear);
        const feriadosMoveisAtuais = await SLAService.addMovableHolidays(currentYear);
        
        // Adicionar feriados para o próximo ano
        const feriadosProximos = await SLAService.addDefaultBrazilianHolidays(nextYear);
        const feriadosMoveisProximos = await SLAService.addMovableHolidays(nextYear);
        
        const totalFeriados = feriadosAtuais.length + feriadosMoveisAtuais.length + 
                             feriadosProximos.length + feriadosMoveisProximos.length;
        
        console.log('🎉 Feriados padrão adicionados com sucesso!');
        console.log(`📊 Resumo:`);
        console.log(`   ${currentYear}: ${feriadosAtuais.length} feriados fixos + ${feriadosMoveisAtuais.length} feriados móveis`);
        console.log(`   ${nextYear}: ${feriadosProximos.length} feriados fixos + ${feriadosMoveisProximos.length} feriados móveis`);
        console.log(`   Total: ${totalFeriados} feriados`);
        
        // Mostrar alguns exemplos de feriados adicionados
        console.log('\n📋 Exemplos de feriados adicionados:');
        const todosFeriados = [...feriadosAtuais, ...feriadosMoveisAtuais, ...feriadosProximos, ...feriadosMoveisProximos];
        todosFeriados.slice(0, 5).forEach(feriado => {
            console.log(`   - ${feriado.nome} (${feriado.data})`);
        });

    } catch (error) {
        console.error('❌ Erro ao adicionar feriados:', error.message);
        throw error;
    } finally {
        await sequelize.close();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    addDefaultHolidays()
        .then(() => {
            console.log('✅ Script executado com sucesso');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Erro ao executar script:', error);
            process.exit(1);
        });
}

module.exports = addDefaultHolidays;
