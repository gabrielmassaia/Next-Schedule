# Guia de Integração N8N - Next Schedule

## Visão Geral

Este guia documenta como integrar o Next Schedule com N8N para automatizar o processo de agendamento de consultas. A API permite que agentes de IA (via N8N) busquem clientes, listem especialidades e profissionais, verifiquem horários disponíveis e criem agendamentos.

## Autenticação

### Gerando uma API Key

1. Acesse o sistema Next Schedule
2. Navegue até **Configurações** → **API Key**
3. Clique em **Criar nova chave**
4. Selecione a **clínica** que será vinculada a esta key
5. Dê um **nome** identificador (ex: "N8N - Automações")
6. Copie a chave gerada (ela será exibida apenas uma vez)

### Usando a API Key

Todas as requisições devem incluir a API key no header `Authorization`:

```
Authorization: Bearer {SUA_API_KEY}
```

Ou alternativamente no header `x-api-key`:

```
x-api-key: {SUA_API_KEY}
```

> **⚠️ IMPORTANTE**: A API key está vinculada a uma clínica específica. Todas as operações serão automaticamente escopadas para essa clínica.

---

## Endpoints Disponíveis

### Base URL

```
http://localhost:3000/api/integrations
```

Para produção, substitua `localhost:3000` pelo domínio do seu servidor.

---

## 1. Buscar Cliente

Verifica se um cliente já está cadastrado na clínica.

**Endpoint:** `GET /api/integrations/clients`

**Query Parameters:**

- `email` (string, required): Email do cliente
- `phoneNumber` (string, required): Telefone com 11 dígitos (DDD + número)

**Exemplo de Requisição:**

```bash
curl -X GET "http://localhost:3000/api/integrations/clients?email=joao@example.com&phoneNumber=11999999999" \
  -H "Authorization: Bearer {API_KEY}"
```

**Resposta de Sucesso (200):**

```json
{
  "client": {
    "id": "uuid-do-cliente",
    "name": "João Silva",
    "email": "joao@example.com",
    "phoneNumber": "11999999999",
    "sex": "male",
    "status": "active",
    "clinicId": "uuid-da-clinica",
    "createdAt": "2025-11-19T23:00:00.000Z",
    "updatedAt": "2025-11-19T23:00:00.000Z"
  }
}
```

**Resposta de Erro (404):**

```json
{
  "message": "Cliente não encontrado"
}
```

---

## 2. Criar Cliente

Cadastra um novo cliente na clínica.

**Endpoint:** `POST /api/integrations/clients`

**Body (JSON):**

```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "phoneNumber": "11999999999",
  "sex": "male"
}
```

**Campos:**

- `name` (string, 3-100 caracteres): Nome completo do cliente
- `email` (string, email válido): Email do cliente
- `phoneNumber` (string, 11 dígitos): Telefone (DDD + número)
- `sex` (enum): `"male"` ou `"female"`

**Exemplo de Requisição:**

```bash
curl -X POST "http://localhost:3000/api/integrations/clients" \
  -H "Authorization: Bearer {API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "phoneNumber": "11999999999",
    "sex": "male"
  }'
```

**Resposta de Sucesso (201):**

```json
{
  "client": {
    "id": "uuid-do-cliente",
    "name": "João Silva",
    "email": "joao@example.com",
    "phoneNumber": "11999999999",
    "sex": "male",
    "status": "active",
    "clinicId": "uuid-da-clinica",
    "createdAt": "2025-11-19T23:00:00.000Z",
    "updatedAt": "2025-11-19T23:00:00.000Z"
  }
}
```

**Resposta de Erro (409):**

```json
{
  "message": "Cliente já cadastrado com este email e telefone"
}
```

---

## 3. Listar Especialidades

Retorna todas as especialidades disponíveis na clínica (baseado nos profissionais cadastrados).

**Endpoint:** `GET /api/integrations/specialties`

**Exemplo de Requisição:**

```bash
curl -X GET "http://localhost:3000/api/integrations/specialties" \
  -H "Authorization: Bearer {API_KEY}"
```

**Resposta de Sucesso (200):**

```json
{
  "specialties": ["Cardiologia", "Dermatologia", "Ortopedia", "Pediatria"]
}
```

---

## 4. Listar Profissionais

Lista os profissionais da clínica, com filtro opcional por especialidade.

**Endpoint:** `GET /api/integrations/professionals`

**Query Parameters (opcionais):**

- `specialty` (string): Filtrar por especialidade específica

**Exemplo de Requisição (todos os profissionais):**

```bash
curl -X GET "http://localhost:3000/api/integrations/professionals" \
  -H "Authorization: Bearer {API_KEY}"
```

**Exemplo de Requisição (filtrado por especialidade):**

```bash
curl -X GET "http://localhost:3000/api/integrations/professionals?specialty=Cardiologia" \
  -H "Authorization: Bearer {API_KEY}"
```

**Resposta de Sucesso (200):**

```json
{
  "professionals": [
    {
      "id": "uuid-do-profissional",
      "name": "Dr. Carlos Mendes",
      "specialty": "Cardiologia",
      "appointmentPriceInCents": 25000,
      "availableFromWeekDay": 1,
      "availableToWeekDay": 5,
      "availableFromTime": "08:00",
      "availableToTime": "18:00"
    }
  ]
}
```

**Campos de Disponibilidade:**

- `availableFromWeekDay` / `availableToWeekDay`: Dias da semana (0=Domingo, 1=Segunda, ..., 6=Sábado)
- `availableFromTime` / `availableToTime`: Horários de trabalho (formato HH:mm)
- `appointmentPriceInCents`: Preço da consulta em centavos (ex: 25000 = R$ 250,00)

---

## 5. Verificar Horários Disponíveis

Retorna os horários livres de um profissional em uma data específica.

**Endpoint:** `GET /api/integrations/available-slots`

**Query Parameters:**

- `professionalId` (string, required): UUID do profissional
- `date` (string, required): Data no formato YYYY-MM-DD

**Exemplo de Requisição:**

```bash
curl -X GET "http://localhost:3000/api/integrations/available-slots?professionalId=uuid-do-profissional&date=2025-11-20" \
  -H "Authorization: Bearer {API_KEY}"
```

**Resposta de Sucesso (200):**

```json
{
  "availableSlots": [
    "08:00",
    "09:00",
    "10:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00"
  ],
  "professionalId": "uuid-do-profissional",
  "professionalName": "Dr. Carlos Mendes",
  "date": "2025-11-20",
  "appointmentPriceInCents": 25000
}
```

**Resposta quando profissional não trabalha no dia:**

```json
{
  "availableSlots": [],
  "message": "Profissional não trabalha neste dia da semana"
}
```

---

## 6. Criar Agendamento

Cria um novo agendamento para um cliente.

**Endpoint:** `POST /api/integrations/appointments`

**Body (JSON):**

```json
{
  "clientId": "uuid-do-cliente",
  "professionalId": "uuid-do-profissional",
  "date": "2025-11-20",
  "time": "14:00",
  "appointmentPriceInCents": 25000
}
```

**Campos:**

- `clientId` (string): UUID do cliente
- `professionalId` (string): UUID do profissional
- `date` (string): Data no formato YYYY-MM-DD
- `time` (string): Horário no formato HH:mm
- `appointmentPriceInCents` (number): Preço em centavos

**Exemplo de Requisição:**

```bash
curl -X POST "http://localhost:3000/api/integrations/appointments" \
  -H "Authorization: Bearer {API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "uuid-do-cliente",
    "professionalId": "uuid-do-profissional",
    "date": "2025-11-20",
    "time": "14:00",
    "appointmentPriceInCents": 25000
  }'
```

**Resposta de Sucesso (200):**

```json
{
  "appointment": {
    "id": "uuid-do-agendamento",
    "date": "2025-11-20T14:00:00.000Z",
    "appointmentPriceInCents": 25000,
    "clinicId": "uuid-da-clinica",
    "clientId": "uuid-do-cliente",
    "professionalId": "uuid-do-profissional",
    "createdAt": "2025-11-19T23:00:00.000Z",
    "updatedAt": "2025-11-19T23:00:00.000Z"
  }
}
```

**Resposta de Erro (409):**

```json
{
  "message": "Horário indisponível"
}
```

---

## Fluxo Completo de Agendamento no N8N

### Passo 1: Cliente entra em contato

Cliente solicita agendamento via WhatsApp/Chat.

### Passo 2: Coletar dados básicos

Perguntar:

- Email
- Telefone

### Passo 3: Verificar se cliente existe

```
GET /api/integrations/clients?email={email}&phoneNumber={telefone}
```

**Se cliente NÃO existe (404):**

- Coletar dados adicionais: Nome completo e Sexo
- Criar cliente: `POST /api/integrations/clients`

**Se cliente existe (200):**

- Prosseguir para próximo passo

### Passo 4: Listar especialidades

```
GET /api/integrations/specialties
```

Apresentar opções ao cliente.

### Passo 5: Cliente escolhe especialidade

Após escolha, listar profissionais:

```
GET /api/integrations/professionals?specialty={especialidade}
```

### Passo 6: Verificar horários disponíveis

Para cada profissional ou após cliente escolher:

```
GET /api/integrations/available-slots?professionalId={id}&date={data}
```

Apresentar horários livres ao cliente.

### Passo 7: Cliente escolhe horário

Criar agendamento:

```
POST /api/integrations/appointments
{
  "clientId": "{id-do-cliente}",
  "professionalId": "{id-do-profissional}",
  "date": "{data}",
  "time": "{horario}",
  "appointmentPriceInCents": {preco}
}
```

### Passo 8: Confirmação

Enviar mensagem de confirmação ao cliente com:

- Nome do profissional
- Data e horário
- Valor da consulta
- Endereço da clínica

---

## Códigos de Status HTTP

| Código | Significado                                          |
| ------ | ---------------------------------------------------- |
| 200    | Sucesso                                              |
| 201    | Criado com sucesso                                   |
| 400    | Dados inválidos                                      |
| 401    | API key ausente ou inválida                          |
| 403    | Sem permissão para acessar o recurso                 |
| 404    | Recurso não encontrado                               |
| 409    | Conflito (ex: horário já ocupado, cliente duplicado) |
| 500    | Erro interno do servidor                             |

---

## Tratamento de Erros

Todas as respostas de erro seguem o formato:

```json
{
  "message": "Descrição do erro"
}
```

Para erros de validação (400), o formato inclui detalhes:

```json
{
  "message": "Payload inválido",
  "issues": [
    {
      "path": ["email"],
      "message": "Email inválido"
    }
  ]
}
```

---

## Segurança

### Multi-tenant

Cada API key está vinculada a uma clínica específica. Todas as operações são automaticamente escopadas para essa clínica, garantindo isolamento total dos dados.

### Validações

- ✅ API key válida e ativa
- ✅ Usuário tem acesso à clínica vinculada à key
- ✅ Cliente, profissional e agendamento pertencem à mesma clínica
- ✅ Horário está disponível antes de criar agendamento
- ✅ Não permite duplicação de clientes (mesmo email + telefone)

---

## Limitações e Considerações

1. **Slots de 60 minutos**: Por padrão, os horários disponíveis são gerados em intervalos de 1 hora
2. **Dias da semana**: Profissionais trabalham em dias consecutivos (ex: Segunda a Sexta)
3. **Fuso horário**: Todas as datas/horários estão em UTC
4. **Rate limiting**: Não há limite de requisições atualmente, mas use com moderação

---

## Suporte

Para dúvidas ou problemas com a integração, entre em contato com o suporte técnico do Next Schedule.
