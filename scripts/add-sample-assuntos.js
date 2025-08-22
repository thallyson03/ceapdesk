// scripts/add-sample-assuntos.js
const { Sequelize } = require('sequelize');
const config = require('../config/database');

async function addSampleAssuntos() {
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
        console.log('🔧 Adicionando assuntos de exemplo...');

        // Buscar setores existentes
        const [setores] = await sequelize.query(`
            SELECT id, nome FROM "Setors" ORDER BY nome
        `);

        if (setores.length === 0) {
            console.log('❌ Nenhum setor encontrado. Crie setores primeiro.');
            return;
        }

        console.log(`📋 Setores encontrados: ${setores.length}`);

        // Assuntos de exemplo por setor
        const assuntosPorSetor = {
            'TI': [
                { nome: 'Problema com impressora', descricao: 'Impressora não está funcionando' },
                { nome: 'Computador não liga', descricao: 'Computador não inicia' },
                { nome: 'Internet lenta', descricao: 'Conexão com internet muito lenta' },
                { nome: 'Software não abre', descricao: 'Programa não consegue ser executado' },
                { nome: 'Email não funciona', descricao: 'Problemas com acesso ao email' },
                { nome: 'Sistema travado', descricao: 'Sistema operacional travando' },
                { nome: 'Periféricos não funcionam', descricao: 'Mouse, teclado ou outros periféricos' },
                { nome: 'Rede Wi-Fi', descricao: 'Problemas com conexão Wi-Fi' }
            ],
            'Administração': [
                { nome: 'Solicitação de documentos', descricao: 'Emissão de documentos' },
                { nome: 'Problema com sistema', descricao: 'Sistema administrativo com erro' },
                { nome: 'Acesso negado', descricao: 'Usuário sem acesso ao sistema' },
                { nome: 'Relatório não gera', descricao: 'Relatórios não estão sendo gerados' },
                { nome: 'Dados incorretos', descricao: 'Informações incorretas no sistema' },
                { nome: 'Backup necessário', descricao: 'Solicitação de backup de dados' },
                { nome: 'Configuração de usuário', descricao: 'Configuração de permissões' },
                { nome: 'Manutenção preventiva', descricao: 'Agendamento de manutenção' }
            ],
            'RH': [
                { nome: 'Folha de pagamento', descricao: 'Problemas com folha de pagamento' },
                { nome: 'Ponto eletrônico', descricao: 'Problemas com registro de ponto' },
                { nome: 'Benefícios', descricao: 'Questões relacionadas a benefícios' },
                { nome: 'Férias', descricao: 'Solicitações e problemas com férias' },
                { nome: 'Admissão', descricao: 'Processo de admissão de funcionários' },
                { nome: 'Demissão', descricao: 'Processo de demissão' },
                { nome: 'Treinamento', descricao: 'Solicitações de treinamento' },
                { nome: 'Avaliação de desempenho', descricao: 'Sistema de avaliação' }
            ],
            'Financeiro': [
                { nome: 'Contas a pagar', descricao: 'Problemas com contas a pagar' },
                { nome: 'Contas a receber', descricao: 'Questões de recebimento' },
                { nome: 'Relatórios financeiros', descricao: 'Geração de relatórios' },
                { nome: 'Conciliação bancária', descricao: 'Problemas com conciliação' },
                { nome: 'Orçamento', descricao: 'Questões relacionadas ao orçamento' },
                { nome: 'Impostos', descricao: 'Declarações e impostos' },
                { nome: 'Auditoria', descricao: 'Processos de auditoria' },
                { nome: 'Fluxo de caixa', descricao: 'Análise de fluxo de caixa' }
            ],
            'Comercial': [
                { nome: 'Vendas', descricao: 'Problemas com sistema de vendas' },
                { nome: 'Clientes', descricao: 'Gestão de clientes' },
                { nome: 'Propostas', descricao: 'Elaboração de propostas' },
                { nome: 'Contratos', descricao: 'Gestão de contratos' },
                { nome: 'Comissões', descricao: 'Cálculo de comissões' },
                { nome: 'Metas', descricao: 'Acompanhamento de metas' },
                { nome: 'CRM', descricao: 'Sistema de CRM' },
                { nome: 'Relatórios comerciais', descricao: 'Relatórios de vendas' }
            ]
        };

        let totalAssuntos = 0;

        for (const setor of setores) {
            const assuntos = assuntosPorSetor[setor.nome] || [];
            
            if (assuntos.length > 0) {
                console.log(`📝 Adicionando ${assuntos.length} assuntos para o setor: ${setor.nome}`);
                
                for (const assunto of assuntos) {
                    // Verificar se o assunto já existe
                    const [existing] = await sequelize.query(`
                        SELECT id FROM "Assuntos" 
                        WHERE nome = ? AND "setorId" = ?
                    `, {
                        replacements: [assunto.nome, setor.id]
                    });

                    if (existing.length === 0) {
                        await sequelize.query(`
                            INSERT INTO "Assuntos" (nome, descricao, "setorId", ativo, "createdAt", "updatedAt")
                            VALUES (?, ?, ?, true, NOW(), NOW())
                        `, {
                            replacements: [assunto.nome, assunto.descricao, setor.id]
                        });
                        totalAssuntos++;
                    } else {
                        console.log(`   ⚠️  Assunto "${assunto.nome}" já existe no setor ${setor.nome}`);
                    }
                }
            } else {
                console.log(`⚠️  Nenhum assunto definido para o setor: ${setor.nome}`);
            }
        }

        console.log('🎉 Assuntos de exemplo adicionados com sucesso!');
        console.log(`📊 Total de assuntos criados: ${totalAssuntos}`);

    } catch (error) {
        console.error('❌ Erro ao adicionar assuntos:', error.message);
        throw error;
    } finally {
        await sequelize.close();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    addSampleAssuntos()
        .then(() => {
            console.log('✅ Script executado com sucesso');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Erro ao executar script:', error);
            process.exit(1);
        });
}

module.exports = addSampleAssuntos;
