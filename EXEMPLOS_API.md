# 🚀 Exemplos Práticos de Uso das APIs

## 📋 Índice
1. [Autenticação](#autenticação)
2. [Usuários](#usuários)
3. [Tickets](#tickets)
4. [Setores](#setores)
5. [Analytics](#analytics)
6. [Relatórios](#relatórios)

---

## 🔐 Autenticação

### Login e Obtenção de Token

**cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

**JavaScript:**
```javascript
async function login(username, password) {
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  
  const data = await response.json();
  localStorage.setItem('token', data.token);
  return data;
}
```

---

## 👤 Usuários

### Listar Usuários
```javascript
async function listarUsuarios() {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/v1/users', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
}
```

### Criar Usuário
```javascript
async function criarUsuario(dados) {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/v1/auth/register', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(dados)
  });
  return response.json();
}
```

---

## 🎫 Tickets

### Listar Tickets com Paginação
```javascript
async function listarTickets(filtros = {}) {
  const token = localStorage.getItem('token');
  const params = new URLSearchParams(filtros);
  
  const response = await fetch(`/api/v1/tickets?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return response.json();
}

// Uso
listarTickets({ page: 1, limit: 10, status: 'aberto' });
```

### Criar Ticket
```javascript
async function criarTicket(dados) {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/v1/tickets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(dados)
  });
  return response.json();
}
```

### Atualizar Ticket
```javascript
async function atualizarTicket(id, dados) {
  const token = localStorage.getItem('token');
  const response = await fetch(`/api/v1/tickets/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(dados)
  });
  return response.json();
}
```

---

## 🏢 Setores

### Listar Setores
```javascript
async function listarSetores() {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/v1/setores', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
}
```

---

## 📊 Analytics

### Obter Produtividade
```javascript
async function obterProdutividade(usuario = 'todos') {
  const token = localStorage.getItem('token');
  const response = await fetch(`/api/v1/analytics/productivity?usuario=${usuario}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
}
```

---

## 📄 Relatórios

### Download de Relatório CSV
```javascript
async function downloadRelatorio(tipo, filtros = {}) {
  const token = localStorage.getItem('token');
  const params = new URLSearchParams(filtros);
  
  const response = await fetch(`/api/v1/reports/${tipo}?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `relatorio_${tipo}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}
```

---

## 🔧 Cliente Python Completo

```python
import requests

class SistemaTicketsClient:
    def __init__(self, base_url="http://localhost:3000/api/v1"):
        self.base_url = base_url
        self.token = None
        self.session = requests.Session()
    
    def login(self, username, password):
        response = self.session.post(f"{self.base_url}/auth/login", 
                                   json={"username": username, "password": password})
        data = response.json()
        self.token = data['token']
        self.session.headers.update({'Authorization': f'Bearer {self.token}'})
        return data
    
    def listar_tickets(self, **filtros):
        response = self.session.get(f"{self.base_url}/tickets", params=filtros)
        return response.json()
    
    def criar_ticket(self, titulo, descricao, prioridade="media"):
        payload = {"titulo": titulo, "descricao": descricao, "prioridade": prioridade}
        response = self.session.post(f"{self.base_url}/tickets", json=payload)
        return response.json()

# Uso
client = SistemaTicketsClient()
client.login("admin", "admin123")
tickets = client.listar_tickets(page=1, limit=5)
print(f"Total de tickets: {tickets['pagination']['totalItems']}")
```

---

## 💻 PowerShell

```powershell
# Login
$LoginBody = @{ username = "admin"; password = "admin123" } | ConvertTo-Json
$LoginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/login" -Method POST -Body $LoginBody
$Token = $LoginResponse.token

# Headers
$Headers = @{ "Authorization" = "Bearer $Token" }

# Listar tickets
$Tickets = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/tickets" -Method GET -Headers $Headers
Write-Host "Tickets encontrados: $($Tickets.tickets.Count)"
```

---

## 🧪 Teste de Integração

```javascript
async function testarAPIs() {
  try {
    // Login
    const loginData = await login('admin', 'admin123');
    console.log('✅ Login:', loginData.user.username);
    
    // Listar tickets
    const tickets = await listarTickets({ page: 1, limit: 5 });
    console.log('✅ Tickets:', tickets.tickets.length);
    
    // Listar usuários
    const users = await listarUsuarios();
    console.log('✅ Usuários:', users.length);
    
    // Analytics
    const productivity = await obterProdutividade();
    console.log('✅ Produtividade:', productivity.length, 'usuários');
    
    console.log('🎉 Todos os testes passaram!');
  } catch (error) {
    console.error('❌ Teste falhou:', error);
  }
}

// Executar testes
testarAPIs();
```

---

## 📱 Uso no Frontend

### Classe de Serviço
```javascript
class ApiService {
  constructor() {
    this.baseUrl = '/api/v1';
    this.token = localStorage.getItem('token');
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    };
  }

  async request(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: this.getHeaders()
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
      return;
    }

    return response;
  }

  async getTickets(filtros = {}) {
    const params = new URLSearchParams(filtros);
    const response = await this.request(`${this.baseUrl}/tickets?${params}`);
    return response.json();
  }

  async createTicket(dados) {
    const response = await this.request(`${this.baseUrl}/tickets`, {
      method: 'POST',
      body: JSON.stringify(dados)
    });
    return response.json();
  }
}

// Uso
const api = new ApiService();
const tickets = await api.getTickets({ page: 1, limit: 10 });
```

---

## 🔍 Debugging

### Verificar Token
```javascript
function debugToken() {
  const token = localStorage.getItem('token');
  if (!token) return console.log('❌ Sem token');
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expira = new Date(payload.exp * 1000);
    console.log('🔍 Token válido até:', expira);
  } catch (error) {
    console.log('❌ Token inválido');
  }
}
```

---

## 📚 Conclusão

Estes exemplos fornecem uma base sólida para usar as APIs do Sistema de Tickets. Para produção, considere:

- ✅ **Rate limiting** para evitar abuso
- ✅ **Validação** rigorosa dos dados
- ✅ **Logs estruturados** para monitoramento
- ✅ **Cache** para endpoints frequentes
- ✅ **Versionamento** das APIs

Teste sempre em desenvolvimento antes de usar em produção!
