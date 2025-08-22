const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
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

// Importar modelos
const { User, Setor, Ticket, Assunto, Feriado, SLA } = require('../models');

async function addSampleData() {
    try {
        console.log('🔄 Conectando ao banco de dados...');
        await sequelize.authenticate();
        console.log('✅ Conexão estabelecida com sucesso!');

        // Criar setores de exemplo
        console.log('📋 Criando setores de exemplo...');
        const setores = await Setor.bulkCreate([
            { nome: 'TI' },
            { nome: 'RH' },
            { nome: 'Financeiro' },
            { nome: 'Marketing' },
            { nome: 'Vendas' }
        ], { ignoreDuplicates: true });

        // Criar assuntos de exemplo
        console.log('📋 Criando assuntos de exemplo...');
        const assuntos = await Assunto.bulkCreate([
            { nome: 'Problema de Login', descricao: 'Dificuldades para acessar o sistema', setorId: setores[0].id },
            { nome: 'Reset de Senha', descricao: 'Solicitação de redefinição de senha', setorId: setores[0].id },
            { nome: 'Instalação de Software', descricao: 'Instalação de programas no computador', setorId: setores[0].id },
            { nome: 'Problema de Internet', descricao: 'Conexão lenta ou instável', setorId: setores[0].id },
            { nome: 'Folha de Pagamento', descricao: 'Dúvidas sobre salário e benefícios', setorId: setores[1].id },
            { nome: 'Férias', descricao: 'Solicitação e dúvidas sobre férias', setorId: setores[1].id },
            { nome: 'Reembolso', descricao: 'Solicitação de reembolso de despesas', setorId: setores[2].id },
            { nome: 'Relatório Financeiro', descricao: 'Geração de relatórios financeiros', setorId: setores[2].id },
            { nome: 'Material Promocional', descricao: 'Solicitação de materiais de marketing', setorId: setores[3].id },
            { nome: 'Campanha Publicitária', descricao: 'Criação e gestão de campanhas', setorId: setores[3].id },
            { nome: 'Proposta Comercial', descricao: 'Elaboração de propostas para clientes', setorId: setores[4].id },
            { nome: 'Negociação', descricao: 'Acompanhamento de negociações', setorId: setores[4].id }
        ], { ignoreDuplicates: true });

        // Criar SLAs de exemplo
        console.log('📋 Criando SLAs de exemplo...');
        await SLA.bulkCreate([
            { setorId: setores[0].id, diasSLA: 2, descricao: 'SLA TI - Urgente' },
            { setorId: setores[1].id, diasSLA: 5, descricao: 'SLA RH - Padrão' },
            { setorId: setores[2].id, diasSLA: 3, descricao: 'SLA Financeiro - Padrão' },
            { setorId: setores[3].id, diasSLA: 4, descricao: 'SLA Marketing - Padrão' },
            { setorId: setores[4].id, diasSLA: 2, descricao: 'SLA Vendas - Urgente' }
        ], { ignoreDuplicates: true });

        // Criar tickets de exemplo para os últimos 30 dias
        console.log('📋 Criando tickets de exemplo...');
        const tickets = [];
        const statuses = ['aberto', 'em progresso', 'fechado'];
        const prioridades = ['baixa', 'media', 'alta'];
        const responsaveis = ['admin', 'joao', 'maria', 'pedro', 'ana'];
        const setoresNomes = setores.map(s => s.nome);

        // Gerar tickets para os últimos 30 dias
        for (let i = 0; i < 100; i++) {
            const dataCriacao = new Date();
            dataCriacao.setDate(dataCriacao.getDate() - Math.floor(Math.random() * 30));
            
            const dataAtualizacao = new Date(dataCriacao);
            if (Math.random() > 0.3) { // 70% dos tickets foram atualizados
                dataAtualizacao.setDate(dataAtualizacao.getDate() + Math.floor(Math.random() * 7));
            }

            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const prioridade = prioridades[Math.floor(Math.random() * prioridades.length)];
            const setor = setoresNomes[Math.floor(Math.random() * setoresNomes.length)];
            const responsavel = Math.random() > 0.2 ? responsaveis[Math.floor(Math.random() * responsaveis.length)] : null;
            const assunto = assuntos[Math.floor(Math.random() * assuntos.length)];

            // Calcular SLA
            const diasSLA = Math.floor(Math.random() * 5) + 1;
            const dataLimiteSLA = new Date(dataCriacao);
            dataLimiteSLA.setDate(dataLimiteSLA.getDate() + diasSLA);

            let statusSLA = 'dentro_prazo';
            if (status === 'fechado') {
                statusSLA = dataAtualizacao <= dataLimiteSLA ? 'dentro_prazo' : 'vencido';
            } else {
                const hoje = new Date();
                if (hoje > dataLimiteSLA) {
                    statusSLA = 'vencido';
                } else if (hoje.getTime() + (24 * 60 * 60 * 1000) > dataLimiteSLA.getTime()) {
                    statusSLA = 'proximo_vencimento';
                }
            }

            tickets.push({
                titulo: `Ticket ${i + 1} - ${assunto.nome}`,
                descricao: `Descrição detalhada do ticket ${i + 1}. Este é um ticket de exemplo para testar o dashboard gráfico.`,
                cpfCnpj: Math.random() > 0.5 ? '123.456.789-00' : '12.345.678/0001-90',
                nomeCliente: `Cliente ${i + 1}`,
                numeroContato: `(11) 99999-${String(i + 1).padStart(4, '0')}`,
                assuntoId: assunto.id,
                status: status,
                prioridade: prioridade,
                setor: setor,
                solicitante: 'admin',
                responsavel: responsavel,
                diasSLA: diasSLA,
                dataLimiteSLA: dataLimiteSLA,
                statusSLA: statusSLA,
                createdAt: dataCriacao,
                updatedAt: dataAtualizacao
            });
        }

        await Ticket.bulkCreate(tickets, { ignoreDuplicates: true });

        // Adicionar feriados de exemplo para 2024
        console.log('📋 Criando feriados de exemplo...');
        const feriados2024 = [
            { nome: 'Confraternização Universal', data: '2024-01-01', tipo: 'nacional' },
            { nome: 'Tiradentes', data: '2024-04-21', tipo: 'nacional' },
            { nome: 'Dia do Trabalho', data: '2024-05-01', tipo: 'nacional' },
            { nome: 'Independência do Brasil', data: '2024-09-07', tipo: 'nacional' },
            { nome: 'Nossa Senhora Aparecida', data: '2024-10-12', tipo: 'nacional' },
            { nome: 'Finados', data: '2024-11-02', tipo: 'nacional' },
            { nome: 'Proclamação da República', data: '2024-11-15', tipo: 'nacional' },
            { nome: 'Natal', data: '2024-12-25', tipo: 'nacional' }
        ];

        await Feriado.bulkCreate(feriados2024, { ignoreDuplicates: true });

        console.log('✅ Dados de exemplo adicionados com sucesso!');
        console.log(`📊 Resumo:`);
        console.log(`   - ${setores.length} setores criados`);
        console.log(`   - ${assuntos.length} assuntos criados`);
        console.log(`   - ${tickets.length} tickets criados`);
        console.log(`   - ${feriados2024.length} feriados criados`);

    } catch (error) {
        console.error('❌ Erro ao adicionar dados de exemplo:', error);
    } finally {
        await sequelize.close();
        console.log('🔌 Conexão com o banco fechada.');
    }
}

addSampleData();
