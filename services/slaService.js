const { Feriado } = require('../models');
const { Op } = require('sequelize');

class SLAService {
    /**
     * Verifica se uma data é final de semana
     * @param {Date} date - Data a ser verificada
     * @returns {boolean} - True se for final de semana
     */
    static isWeekend(date) {
        const day = date.getDay();
        return day === 0 || day === 6; // 0 = Domingo, 6 = Sábado
    }

    /**
     * Verifica se uma data é feriado
     * @param {Date} date - Data a ser verificada
     * @returns {Promise<boolean>} - True se for feriado
     */
    static async isHoliday(date) {
        const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
        
        const feriado = await Feriado.findOne({
            where: {
                data: dateString,
                ativo: true
            }
        });
        
        return !!feriado;
    }

    /**
     * Verifica se uma data é dia útil (não é final de semana nem feriado)
     * @param {Date} date - Data a ser verificada
     * @returns {Promise<boolean>} - True se for dia útil
     */
    static async isBusinessDay(date) {
        if (this.isWeekend(date)) {
            return false;
        }
        
        return !(await this.isHoliday(date));
    }

    /**
     * Calcula a próxima data útil a partir de uma data
     * @param {Date} startDate - Data inicial
     * @returns {Promise<Date>} - Próxima data útil
     */
    static async getNextBusinessDay(startDate) {
        let currentDate = new Date(startDate);
        
        while (!(await this.isBusinessDay(currentDate))) {
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return currentDate;
    }

    /**
     * Calcula a data limite da SLA considerando apenas dias úteis
     * @param {Date} startDate - Data de início (criação do ticket)
     * @param {number} businessDays - Número de dias úteis para a SLA
     * @returns {Promise<Date>} - Data limite da SLA
     */
    static async calculateSLADueDate(startDate, businessDays) {
        if (businessDays <= 0) {
            return new Date(startDate);
        }

        let currentDate = new Date(startDate);
        let businessDaysCount = 0;
        
        // Se a data inicial não for dia útil, começar do próximo dia útil
        if (!(await this.isBusinessDay(currentDate))) {
            currentDate = await this.getNextBusinessDay(currentDate);
        }
        
        // Contar os dias úteis necessários
        while (businessDaysCount < businessDays) {
            if (await this.isBusinessDay(currentDate)) {
                businessDaysCount++;
            }
            
            if (businessDaysCount < businessDays) {
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }
        
        return currentDate;
    }

    /**
     * Calcula quantos dias úteis restam até a data limite da SLA
     * @param {Date} dueDate - Data limite da SLA
     * @param {Date} currentDate - Data atual (opcional, usa hoje se não informada)
     * @returns {Promise<number>} - Número de dias úteis restantes
     */
    static async getRemainingBusinessDays(dueDate, currentDate = new Date()) {
        const due = new Date(dueDate);
        const current = new Date(currentDate);
        
        // Se a data atual é posterior à data limite, retornar negativo
        if (current > due) {
            return -1;
        }
        
        let businessDays = 0;
        let checkDate = new Date(current);
        
        while (checkDate <= due) {
            if (await this.isBusinessDay(checkDate)) {
                businessDays++;
            }
            checkDate.setDate(checkDate.getDate() + 1);
        }
        
        return businessDays;
    }

    /**
     * Adiciona feriados nacionais padrão do Brasil para o ano especificado
     * @param {number} year - Ano para adicionar os feriados
     * @returns {Promise<Array>} - Array com os feriados criados
     */
    static async addDefaultBrazilianHolidays(year) {
        const defaultHolidays = [
            { nome: 'Confraternização Universal', data: `${year}-01-01`, tipo: 'nacional' },
            { nome: 'Tiradentes', data: `${year}-04-21`, tipo: 'nacional' },
            { nome: 'Dia do Trabalho', data: `${year}-05-01`, tipo: 'nacional' },
            { nome: 'Independência do Brasil', data: `${year}-09-07`, tipo: 'nacional' },
            { nome: 'Nossa Senhora Aparecida', data: `${year}-10-12`, tipo: 'nacional' },
            { nome: 'Finados', data: `${year}-11-02`, tipo: 'nacional' },
            { nome: 'Proclamação da República', data: `${year}-11-15`, tipo: 'nacional' },
            { nome: 'Natal', data: `${year}-12-25`, tipo: 'nacional' }
        ];

        const createdHolidays = [];
        
        for (const holiday of defaultHolidays) {
            // Verificar se o feriado já existe
            const existing = await Feriado.findOne({
                where: {
                    data: holiday.data,
                    nome: holiday.nome
                }
            });
            
            if (!existing) {
                const newHoliday = await Feriado.create(holiday);
                createdHolidays.push(newHoliday);
            }
        }
        
        return createdHolidays;
    }

    /**
     * Calcula a data de Páscoa (Algoritmo de Meeus/Jones/Butcher)
     * @param {number} year - Ano
     * @returns {Date} - Data da Páscoa
     */
    static calculateEaster(year) {
        const a = year % 19;
        const b = Math.floor(year / 100);
        const c = year % 100;
        const d = Math.floor(b / 4);
        const e = b % 4;
        const f = Math.floor((b + 8) / 25);
        const g = Math.floor((b - f + 1) / 3);
        const h = (19 * a + b - d - g + 15) % 30;
        const i = Math.floor(c / 4);
        const k = c % 4;
        const l = (32 + 2 * e + 2 * i - h - k) % 7;
        const m = Math.floor((a + 11 * h + 22 * l) / 451);
        const month = Math.floor((h + l - 7 * m + 114) / 31);
        const day = ((h + l - 7 * m + 114) % 31) + 1;
        
        return new Date(year, month - 1, day);
    }

    /**
     * Adiciona feriados móveis (Carnaval, Páscoa, Corpus Christi) para o ano
     * @param {number} year - Ano para adicionar os feriados
     * @returns {Promise<Array>} - Array com os feriados criados
     */
    static async addMovableHolidays(year) {
        const easter = this.calculateEaster(year);
        const carnival = new Date(easter);
        carnival.setDate(easter.getDate() - 47); // 47 dias antes da Páscoa
        const corpusChristi = new Date(easter);
        corpusChristi.setDate(easter.getDate() + 60); // 60 dias após a Páscoa
        
        const movableHolidays = [
            { nome: 'Carnaval', data: carnival.toISOString().split('T')[0], tipo: 'nacional' },
            { nome: 'Páscoa', data: easter.toISOString().split('T')[0], tipo: 'nacional' },
            { nome: 'Corpus Christi', data: corpusChristi.toISOString().split('T')[0], tipo: 'nacional' }
        ];

        const createdHolidays = [];
        
        for (const holiday of movableHolidays) {
            // Verificar se o feriado já existe
            const existing = await Feriado.findOne({
                where: {
                    data: holiday.data,
                    nome: holiday.nome
                }
            });
            
            if (!existing) {
                const newHoliday = await Feriado.create(holiday);
                createdHolidays.push(newHoliday);
            }
        }
        
        return createdHolidays;
    }
}

module.exports = SLAService;
