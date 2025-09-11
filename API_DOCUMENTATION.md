# 📚 Documentação da API - Sistema de Tickets

## 🌐 **URL Base**
```
https://centralcrm.ceapebank.com.br
```

## 🔐 **Autenticação**
A API utiliza **JWT (JSON Web Token)** para autenticação. O token deve ser incluído no header `Authorization` de todas as requisições:

```
Authorization: Bearer <seu_token_jwt>
```

**⏰ Duração do Token:** 6 meses (180 dias) - Ideal para sistemas 24/7

---

## 👤 **ENDPOINTS DE USUÁRIOS** (`/api/v1/users`)

### 1. **Login** - POST `/api/v1/users/login`
**Descrição:** Autenticar usuário e obter token JWT

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
    "username": "admin",
    "password": "admin123"
}
```

**Resposta de Sucesso (200):**
```json
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
        "id": 1,
        "username": "admin",
        "role": "admin",
        "setores": [
            {
                "id": 1,
                "nome": "Administração"
            }
        ]
    }
}
```

**Resposta de Erro (401):**
```json
{
    "error": "Credenciais inválidas"
}
```

---

### 2. **Listar Usuários** - GET `/api/v1/users`
**Descrição:** Listar todos os usuários (apenas admin)

**Headers:**
```
Authorization: Bearer <token>
```

**Resposta de Sucesso (200):**
```json
[
    {
        "id": 1,
        "username": "admin",
        "role": "admin",
        "createdAt": "2025-08-20T17:30:00.000Z",
        "setores": [
            {
                "id": 1,
                "nome": "Administração"
            }
        ]
    },
    {
        "id": 2,
        "username": "usuario1",
        "role": "user",
        "createdAt": "2025-08-20T17:35:00.000Z",
        "setores": [
            {
                "id": 2,
                "nome": "TI"
            }
        ]
    }
]
```

---

### 3. **Buscar Usuários por Setor** - GET `/api/v1/users/setor/:setor`
**Descrição:** Listar usuários de um setor específico

**Headers:**
```
Authorization: Bearer <token>
```

**Parâmetros de URL:**
- `setor` (string): Nome do setor

**Exemplo:** `GET /api/v1/users/setor/TI`

**Resposta de Sucesso (200):**
```json
[
    {
        "id": 2,
        "username": "usuario1",
        "role": "user",
        "setores": [
            {
                "id": 2,
                "nome": "TI"
            }
        ]
    }
]
```

---

### 4. **Criar Usuário** - POST `/api/v1/users`
**Descrição:** Criar novo usuário (apenas admin)

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
    "username": "novo_usuario",
    "password": "senha123",
    "email": "usuario@exemplo.com",
    "role": "user",
    "setor": "TI",
    "setorIds": [2, 3]
}
```

**Campos:**
- `username` (string, obrigatório): Nome do usuário
- `password` (string, obrigatório): Senha (mín. 8 caracteres)
- `email` (string, obrigatório): Email válido
- `role` (string, opcional): "user" ou "admin" (padrão: "user")
- `setor` (string, opcional): Setor principal
- `setorIds` (array, opcional): IDs de setores adicionais

**Resposta de Sucesso (201):**
```json
{
    "id": 3,
    "username": "novo_usuario",
    "role": "user",
    "email": "usuario@exemplo.com",
    "setores": [
        {
            "id": 2,
            "nome": "TI"
        },
        {
            "id": 3,
            "nome": "Suporte"
        }
    ]
}
```

---

### 5. **Atualizar Usuário** - PUT `/api/v1/users/:id`
**Descrição:** Atualizar dados de um usuário (apenas admin)

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
    "username": "usuario_atualizado",
    "role": "admin",
    "setorIds": [1, 2],
    "password": "nova_senha123"
}
```

**Resposta de Sucesso (200):**
```json
{
    "message": "Usuário atualizado com sucesso"
}
```

---

### 6. **Deletar Usuário** - DELETE `/api/v1/users/:id`
**Descrição:** Deletar um usuário (apenas admin)

**Headers:**
```
Authorization: Bearer <token>
```

**Resposta de Sucesso (200):**
```json
{
    "message": "Usuário deletado com sucesso"
}
```

---

## 🎫 **ENDPOINTS DE TICKETS** (`/api/v1/tickets`)

### 1. **Criar Ticket** - POST `/api/v1/tickets`
**Descrição:** Criar um novo ticket

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
    "titulo": "Problema com impressora",
    "descricao": "A impressora não está funcionando corretamente",
    "prioridade": "alta",
    "areaResponsavel": "TI"
}
```

**Campos:**
- `titulo` (string, obrigatório): Título do ticket
- `descricao` (string, obrigatório): Descrição detalhada
- `prioridade` (string, opcional): "baixa", "media", "alta" (padrão: "media")
- `areaResponsavel` (string, opcional): Setor responsável

**Resposta de Sucesso (201):**
```json
{
    "id": 1,
    "titulo": "Problema com impressora",
    "descricao": "A impressora não está funcionando corretamente",
    "status": "aberto",
    "prioridade": "alta",
    "setor": "TI",
    "solicitante": "usuario1",
    "responsavel": "admin",
    "diasSLA": 3,
    "dataLimiteSLA": "2025-08-23T17:30:00.000Z",
    "statusSLA": "dentro_prazo",
    "createdAt": "2025-08-20T17:30:00.000Z"
}
```

---

### 2. **Listar Tickets** - GET `/api/v1/tickets`
**Descrição:** Listar tickets com paginação e filtros

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (number, opcional): Página (padrão: 1)
- `limit` (number, opcional): Itens por página (padrão: 10)
- `status` (string, opcional): Filtrar por status
- `prioridade` (string, opcional): Filtrar por prioridade
- `setor` (string, opcional): Filtrar por setor
- `search` (string, opcional): Buscar por título ou descrição

**Exemplo:** `GET /api/v1/tickets?page=1&limit=10&status=aberto&setor=TI`

**Resposta de Sucesso (200):**
```json
{
    "tickets": [
        {
            "id": 1,
            "titulo": "Problema com impressora",
            "descricao": "A impressora não está funcionando corretamente",
            "status": "aberto",
            "prioridade": "alta",
            "setor": "TI",
            "solicitante": "usuario1",
            "responsavel": "admin",
            "diasSLA": 3,
            "dataLimiteSLA": "2025-08-23T17:30:00.000Z",
            "statusSLA": "dentro_prazo",
            "createdAt": "2025-08-20T17:30:00.000Z"
        }
    ],
    "total": 1,
    "page": 1,
    "totalPages": 1
}
```

---

### 3. **Buscar Ticket por ID** - GET `/api/v1/tickets/:id`
**Descrição:** Obter detalhes de um ticket específico

**Headers:**
```
Authorization: Bearer <token>
```

**Resposta de Sucesso (200):**
```json
{
    "id": 1,
    "titulo": "Problema com impressora",
    "descricao": "A impressora não está funcionando corretamente",
    "status": "aberto",
    "prioridade": "alta",
    "setor": "TI",
    "solicitante": "usuario1",
    "responsavel": "admin",
    "diasSLA": 3,
    "dataLimiteSLA": "2025-08-23T17:30:00.000Z",
    "statusSLA": "dentro_prazo",
    "createdAt": "2025-08-20T17:30:00.000Z",
    "updatedAt": "2025-08-20T17:30:00.000Z",
    "anotacoes": [
        {
            "id": 1,
            "conteudo": "Ticket em análise",
            "autor": "admin",
            "createdAt": "2025-08-20T17:35:00.000Z"
        }
    ],
    "historico": [
        {
            "id": 1,
            "acao": "criado",
            "detalhes": "Ticket criado",
            "usuario": "usuario1",
            "createdAt": "2025-08-20T17:30:00.000Z"
        }
    ]
}
```

---

### 4. **Atualizar Ticket** - PUT `/api/v1/tickets/:id`
**Descrição:** Atualizar status ou dados de um ticket

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
    "status": "em_andamento",
    "responsavel": "admin",
    "prioridade": "alta"
}
```

**Resposta de Sucesso (200):**
```json
{
    "message": "Ticket atualizado com sucesso",
    "ticket": {
        "id": 1,
        "status": "em_andamento",
        "responsavel": "admin",
        "prioridade": "alta"
    }
}
```

---

### 5. **Adicionar Anotação** - POST `/api/v1/tickets/:id/anotacoes`
**Descrição:** Adicionar uma anotação ao ticket

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
    "conteudo": "Ticket em análise técnica"
}
```

**Resposta de Sucesso (201):**
```json
{
    "id": 2,
    "conteudo": "Ticket em análise técnica",
    "autor": "admin",
    "ticketId": 1,
    "createdAt": "2025-08-20T17:40:00.000Z"
}
```

---

### 6. **Alertas de SLA** - GET `/api/v1/tickets/sla/alertas`
**Descrição:** Obter tickets com SLA vencido ou próximo do vencimento

**Headers:**
```
Authorization: Bearer <token>
```

**Resposta de Sucesso (200):**
```json
[
    {
        "id": 1,
        "titulo": "Problema com impressora",
        "statusSLA": "vencido",
        "dataLimiteSLA": "2025-08-19T17:30:00.000Z",
        "diasSLA": -1
    }
]
```

---

## 🏢 **ENDPOINTS DE SETORES** (`/api/v1/setores`)

### 1. **Listar Setores** - GET `/api/v1/setores`
**Descrição:** Listar todos os setores

**Headers:**
```
Authorization: Bearer <token>
```

**Resposta de Sucesso (200):**
```json
[
    {
        "id": 1,
        "nome": "Administração"
    },
    {
        "id": 2,
        "nome": "TI"
    },
    {
        "id": 3,
        "nome": "Suporte"
    }
]
```

---

### 2. **Criar Setor** - POST `/api/v1/setores`
**Descrição:** Criar um novo setor (apenas admin)

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
    "nome": "Recursos Humanos"
}
```

**Resposta de Sucesso (201):**
```json
{
    "id": 4,
    "nome": "Recursos Humanos",
    "createdAt": "2025-08-20T17:45:00.000Z"
}
```

---

### 3. **Atualizar Setor** - PUT `/api/v1/setores/:id`
**Descrição:** Atualizar nome de um setor (apenas admin)

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
    "nome": "Tecnologia da Informação"
}
```

**Resposta de Sucesso (200):**
```json
{
    "message": "Setor atualizado com sucesso"
}
```

---

### 4. **Deletar Setor** - DELETE `/api/v1/setores/:id`
**Descrição:** Deletar um setor (apenas admin)

**Headers:**
```
Authorization: Bearer <token>
```

**Resposta de Sucesso (200):**
```json
{
    "message": "Setor deletado com sucesso"
}
```

---

## 📊 **ENDPOINTS DE ANALYTICS** (`/api/v1/analytics`)

### 1. **Dashboard Analytics** - GET `/api/v1/analytics/dashboard`
**Descrição:** Obter estatísticas do dashboard

**Headers:**
```
Authorization: Bearer <token>
```

**Resposta de Sucesso (200):**
```json
{
    "totalTickets": 150,
    "ticketsAbertos": 45,
    "ticketsEmAndamento": 30,
    "ticketsFechados": 75,
    "ticketsPorStatus": [
        {
            "status": "aberto",
            "count": 45
        },
        {
            "status": "em_andamento",
            "count": 30
        },
        {
            "status": "fechado",
            "count": 75
        }
    ],
    "ticketsPorSetor": [
        {
            "setor": "TI",
            "count": 60
        },
        {
            "setor": "Suporte",
            "count": 45
        }
    ],
    "ticketsPorPrioridade": [
        {
            "prioridade": "baixa",
            "count": 30
        },
        {
            "prioridade": "media",
            "count": 80
        },
        {
            "prioridade": "alta",
            "count": 40
        }
    ]
}
```

---

### 2. **Tickets por Período** - GET `/api/v1/analytics/tickets-periodo`
**Descrição:** Obter estatísticas de tickets por período

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `startDate` (string, opcional): Data inicial (YYYY-MM-DD)
- `endDate` (string, opcional): Data final (YYYY-MM-DD)

**Resposta de Sucesso (200):**
```json
{
    "periodo": {
        "inicio": "2025-08-01",
        "fim": "2025-08-31"
    },
    "totalTickets": 150,
    "ticketsPorDia": [
        {
            "data": "2025-08-01",
            "count": 5
        },
        {
            "data": "2025-08-02",
            "count": 8
        }
    ]
}
```

---

## 📋 **ENDPOINTS DE RELATÓRIOS** (`/api/v1/reports`)

### 1. **Download Relatório CSV** - GET `/api/v1/reports/tickets`
**Descrição:** Baixar relatório de tickets em CSV

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `startDate` (string, opcional): Data inicial (YYYY-MM-DD)
- `endDate` (string, opcional): Data final (YYYY-MM-DD)
- `status` (string, opcional): Filtrar por status
- `setor` (string, opcional): Filtrar por setor

**Resposta de Sucesso (200):**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="relatorio_tickets_2025-08-20.csv"

Número do Ticket,Título,Status,Prioridade,Setor,Responsável,Criado por,Data de Criação,Data Limite SLA,Status SLA,Dias SLA
#1,Problema com impressora,aberto,alta,TI,admin,usuario1,20/08/2025,23/08/2025,dentro_prazo,3
```

---

### 2. **Relatório Paginado** - GET `/api/v1/reports/tickets-paginado`
**Descrição:** Obter relatório de tickets com paginação

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (number, opcional): Página (padrão: 1)
- `limit` (number, opcional): Itens por página (padrão: 50)
- `startDate` (string, opcional): Data inicial
- `endDate` (string, opcional): Data final
- `status` (string, opcional): Filtrar por status
- `setor` (string, opcional): Filtrar por setor

**Resposta de Sucesso (200):**
```json
{
    "tickets": [
        {
            "id": 1,
            "titulo": "Problema com impressora",
            "status": "aberto",
            "prioridade": "alta",
            "setor": "TI",
            "responsavel": "admin",
            "solicitante": "usuario1",
            "createdAt": "2025-08-20T17:30:00.000Z",
            "dataLimiteSLA": "2025-08-23T17:30:00.000Z",
            "statusSLA": "dentro_prazo",
            "diasSLA": 3
        }
    ],
    "total": 150,
    "page": 1,
    "totalPages": 3
}
```

---

### 3. **Estatísticas do Relatório** - GET `/api/v1/reports/stats`
**Descrição:** Obter estatísticas para relatórios

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `startDate` (string, opcional): Data inicial
- `endDate` (string, opcional): Data final
- `status` (string, opcional): Filtrar por status
- `setor` (string, opcional): Filtrar por setor

**Resposta de Sucesso (200):**
```json
{
    "totalTickets": 150,
    "statusStats": [
        {
            "status": "aberto",
            "count": 45
        },
        {
            "status": "em_andamento",
            "count": 30
        }
    ],
    "setorStats": [
        {
            "setor": "TI",
            "count": 60
        },
        {
            "setor": "Suporte",
            "count": 45
        }
    ],
    "slaStats": [
        {
            "statusSLA": "dentro_prazo",
            "count": 120
        },
        {
            "statusSLA": "vencido",
            "count": 15
        }
    ]
}
```

---

## ⏰ **ENDPOINTS DE SLA** (`/api/v1/sla`)

### 1. **Listar SLAs** - GET `/api/v1/sla`
**Descrição:** Listar todos os SLAs

**Headers:**
```
Authorization: Bearer <token>
```

**Resposta de Sucesso (200):**
```json
[
    {
        "id": 1,
        "setorId": 2,
        "diasSLA": 3,
        "ativo": true,
        "setor": {
            "id": 2,
            "nome": "TI"
        }
    }
]
```

---

### 2. **Criar SLA** - POST `/api/v1/sla`
**Descrição:** Criar um novo SLA (apenas admin)

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
    "setorId": 2,
    "diasSLA": 5
}
```

**Resposta de Sucesso (201):**
```json
{
    "id": 2,
    "setorId": 2,
    "diasSLA": 5,
    "ativo": true,
    "createdAt": "2025-08-20T17:50:00.000Z"
}
```

---

### 3. **Atualizar SLA** - PUT `/api/v1/sla/:id`
**Descrição:** Atualizar um SLA (apenas admin)

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
    "diasSLA": 7,
    "ativo": false
}
```

**Resposta de Sucesso (200):**
```json
{
    "message": "SLA atualizado com sucesso"
}
```

---

### 4. **Deletar SLA** - DELETE `/api/v1/sla/:id`
**Descrição:** Deletar um SLA (apenas admin)

**Headers:**
```
Authorization: Bearer <token>
```

**Resposta de Sucesso (200):**
```json
{
    "message": "SLA deletado com sucesso"
}
```

---

### 5. **Alertas de SLA** - GET `/api/v1/sla/alertas`
**Descrição:** Obter tickets com SLA vencido ou próximo do vencimento

**Headers:**
```
Authorization: Bearer <token>
```

**Resposta de Sucesso (200):**
```json
[
    {
        "id": 1,
        "titulo": "Problema com impressora",
        "statusSLA": "vencido",
        "dataLimiteSLA": "2025-08-19T17:30:00.000Z",
        "diasSLA": -1,
        "setor": "TI"
    }
]
```

---

## 🔔 **ENDPOINTS DE NOTIFICAÇÕES** (`/api/v1/notifications`)

### 1. **Listar Notificações** - GET `/api/v1/notifications`
**Descrição:** Listar notificações do usuário

**Headers:**
```
Authorization: Bearer <token>
```

**Resposta de Sucesso (200):**
```json
[
    {
        "id": 1,
        "tipo": "novo_ticket",
        "mensagem": "Novo ticket criado: Problema com impressora",
        "lida": false,
        "createdAt": "2025-08-20T17:30:00.000Z"
    }
]
```

---

### 2. **Marcar como Lida** - PUT `/api/v1/notifications/:id/read`
**Descrição:** Marcar notificação como lida

**Headers:**
```
Authorization: Bearer <token>
```

**Resposta de Sucesso (200):**
```json
{
    "message": "Notificação marcada como lida"
}
```

---

## 📝 **CÓDIGOS DE STATUS HTTP**

| Código | Descrição |
|--------|-----------|
| 200 | OK - Requisição bem-sucedida |
| 201 | Created - Recurso criado com sucesso |
| 400 | Bad Request - Dados inválidos |
| 401 | Unauthorized - Token inválido ou ausente |
| 403 | Forbidden - Acesso negado |
| 404 | Not Found - Recurso não encontrado |
| 429 | Too Many Requests - Muitas requisições |
| 500 | Internal Server Error - Erro interno do servidor |

---

## 🚨 **CÓDIGOS DE ERRO COMUNS**

### **401 - Unauthorized**
```json
{
    "error": "Token inválido ou expirado"
}
```

### **403 - Forbidden**
```json
{
    "error": "Acesso negado. Apenas administradores podem realizar esta ação."
}
```

### **404 - Not Found**
```json
{
    "error": "Recurso não encontrado"
}
```

### **400 - Bad Request**
```json
{
    "error": "Dados inválidos",
    "details": [
        "Campo 'username' é obrigatório",
        "Campo 'password' deve ter pelo menos 8 caracteres"
    ]
}
```

---

## 🔧 **EXEMPLOS DE USO COM POSTMAN**

### **1. Configuração do Postman**

1. **Criar uma nova Collection**
2. **Configurar variável de ambiente:**
   - Nome: `base_url`
   - Valor: `https://centralcrm.ceapebank.com.br`

3. **Configurar variável de ambiente:**
   - Nome: `token`
   - Valor: (será preenchido após login)

### **2. Fluxo de Autenticação**

**Step 1: Login**
```
POST {{base_url}}/api/v1/users/login
Content-Type: application/json

{
    "username": "admin",
    "password": "admin123"
}
```

**Step 2: Extrair Token (Test Script)**
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("token", response.token);
}
```

**Step 3: Usar Token nas Requisições**
```
Authorization: Bearer {{token}}
```

### **3. Exemplo de Collection**

```json
{
    "info": {
        "name": "Sistema de Tickets API",
        "description": "API completa do sistema de tickets"
    },
    "variable": [
        {
            "key": "base_url",
            "value": "https://centralcrm.ceapebank.com.br"
        },
        {
            "key": "token",
            "value": ""
        }
    ],
    "item": [
        {
            "name": "Auth",
            "item": [
                {
                    "name": "Login",
                    "request": {
                        "method": "POST",
                        "header": [
                            {
                                "key": "Content-Type",
                                "value": "application/json"
                            }
                        ],
                        "body": {
                            "mode": "raw",
                            "raw": "{\n    \"username\": \"admin\",\n    \"password\": \"admin123\"\n}"
                        },
                        "url": {
                            "raw": "{{base_url}}/api/v1/users/login"
                        }
                    },
                    "event": [
                        {
                            "listen": "test",
                            "script": {
                                "exec": [
                                    "if (pm.response.code === 200) {",
                                    "    const response = pm.response.json();",
                                    "    pm.environment.set(\"token\", response.token);",
                                    "}"
                                ]
                            }
                        }
                    ]
                }
            ]
        },
        {
            "name": "Tickets",
            "item": [
                {
                    "name": "Listar Tickets",
                    "request": {
                        "method": "GET",
                        "header": [
                            {
                                "key": "Authorization",
                                "value": "Bearer {{token}}"
                            }
                        ],
                        "url": {
                            "raw": "{{base_url}}/api/v1/tickets?page=1&limit=10"
                        }
                    }
                },
                {
                    "name": "Criar Ticket",
                    "request": {
                        "method": "POST",
                        "header": [
                            {
                                "key": "Authorization",
                                "value": "Bearer {{token}}"
                            },
                            {
                                "key": "Content-Type",
                                "value": "application/json"
                            }
                        ],
                        "body": {
                            "mode": "raw",
                            "raw": "{\n    \"titulo\": \"Teste via API\",\n    \"descricao\": \"Ticket criado via Postman\",\n    \"prioridade\": \"media\",\n    \"areaResponsavel\": \"TI\"\n}"
                        },
                        "url": {
                            "raw": "{{base_url}}/api/v1/tickets"
                        }
                    }
                }
            ]
        }
    ]
}
```

---

## 📞 **SUPORTE**

Para dúvidas ou problemas com a API, entre em contato com a equipe de desenvolvimento.

**URL da API:** `https://centralcrm.ceapebank.com.br`  
**Versão:** 1.0.0  
**Última atualização:** Agosto 2025
