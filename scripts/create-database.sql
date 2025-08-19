-- Script para criar o banco de dados PostgreSQL
-- Execute este script como usuário postgres ou superusuário

-- Criar o banco de dados
CREATE DATABASE sistema_tickets
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'Portuguese_Brazil.1252'
    LC_CTYPE = 'Portuguese_Brazil.1252'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- Conectar ao banco criado
\c sistema_tickets;

-- Criar extensões úteis (opcional)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Comentário no banco
COMMENT ON DATABASE sistema_tickets IS 'Sistema de Tickets - Banco de dados principal';






