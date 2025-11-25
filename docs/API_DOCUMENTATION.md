# Documentação da API e Server Actions

Esta documentação detalha todos os endpoints disponíveis no sistema, incluindo rotas de API públicas (integrações), rotas internas e Server Actions.

## 1. API Pública (Integrações)

Estas rotas são destinadas a integrações externas e requerem autenticação via API Key.
**Autenticação:** Header `Authorization: Bearer <api-key>` ou `x-api-key: <api-key>`.

### Agendamentos

#### Criar Agendamento

- **Método:** `POST`
- **URL:** `/api/integrations/appointments`
- **Descrição:** Cria um novo agendamento para um cliente com um profissional específico.
- **Corpo da Requisição (JSON):**
  ```json
  {
    "clientId": "uuid",
    "professionalId": "uuid",
    "date": "YYYY-MM-DD",
    "time": "HH:mm",
    "appointmentPriceInCents": 10000 // Valor em centavos
  }
  ```
- **Retorno (Sucesso - 200):**
  ```json
  {
    "appointment": { ... } // Objeto do agendamento criado
  }
  ```
- **Erros:**
  - 400: Payload inválido.
  - 401: API Key ausente ou inválida.
  - 404: Cliente ou profissional não encontrado na clínica.
  - 409: Horário indisponível.

#### Listar Agendamentos do Cliente

- **Método:** `GET`
- **URL:** `/api/integrations/appointments`
- **Descrição:** Retorna todos os agendamentos de um cliente específico.
- **Parâmetros de Query:**
  - `clientId` (Obrigatório): UUID do cliente.
- **Retorno (Sucesso - 200):**
  ```json
  {
    "appointments": [
      {
        "id": "uuid",
        "date": "YYYY-MM-DDTHH:mm:ss.sssZ",
        "professional": { ... },
        "client": { ... },
        ...
      }
    ]
  }
  ```
- **Erros:**
  - 400: ID do cliente obrigatório.
  - 404: Cliente não encontrado.

#### Consultar Horários Disponíveis

- **Método:** `GET`
- **URL:** `/api/integrations/available-slots`
- **Descrição:** Retorna os horários disponíveis para um profissional em uma data específica.
- **Parâmetros de Query:**
  - `professionalCpf` (Obrigatório): CPF do profissional (com ou sem formatação, 11-14 caracteres).
  - `date` (Obrigatório): Data no formato YYYY-MM-DD.
- **Retorno (Sucesso - 200):**
  ```json
  {
    "availableSlots": ["09:00", "10:00", ...],
    "professionalId": "uuid",
    "professionalCpf": "12345678900",
    "professionalName": "Nome",
    "date": "YYYY-MM-DD",
    "appointmentPriceInCents": 10000
  }
  ```
- **Notas Importantes:**
  - ✅ Todos os horários retornados estão no **timezone da clínica**
  - ✅ O sistema converte automaticamente UTC → Local para comparações
  - ✅ Agendamentos são sempre salvos em UTC no banco de dados

### Clientes

#### Buscar Cliente

- **Método:** `GET`
- **URL:** `/api/integrations/clients`
- **Descrição:** Busca um cliente pelo email e telefone.
- **Parâmetros de Query:**
  - `email` (Obrigatório): Email do cliente.
  - `phoneNumber` (Obrigatório): Telefone do cliente (11 dígitos).
- **Retorno (Sucesso - 200):**
  ```json
  {
    "client": { ... } // Objeto do cliente
  }
  ```
- **Erros:**
  - 404: Cliente não encontrado.

#### Criar Cliente

- **Método:** `POST`
- **URL:** `/api/integrations/clients`
- **Descrição:** Cadastra um novo cliente na clínica.
- **Corpo da Requisição (JSON):**
  ```json
  {
    "name": "Nome do Cliente",
    "email": "cliente@exemplo.com",
    "phoneNumber": "11999999999",
    "sex": "male" | "female"
  }
  ```
- **Retorno (Sucesso - 201):**
  ```json
  {
    "client": { ... } // Objeto do cliente criado
  }
  ```
- **Erros:**
  - 409: Cliente já cadastrado com este email e telefone.

### Profissionais

#### Listar Profissionais

- **Método:** `GET`
- **URL:** `/api/integrations/professionals`
- **Descrição:** Lista todos os profissionais da clínica ou filtra por especialidade.
- **Parâmetros de Query:**
  - `specialty` (Opcional): Filtrar por especialidade.
- **Retorno (Sucesso - 200):**
  ```json
  {
    "professionals": [
      {
        "id": "uuid",
        "name": "Nome",
        "cpf": "12345678900",
        "specialty": "Especialidade",
        "workingDays": [1, 2, 3, 4, 5],
        "availableFromTime": "08:00",
        "availableToTime": "18:00",
        "appointmentPriceInCents": 15000,
        ...
      }
    ]
  }
  ```
- **Notas:**
  - `workingDays`: Array de dias da semana (0=Domingo, 1=Segunda, ..., 6=Sábado)
  - Horários (`availableFromTime`, `availableToTime`) estão em **hora local** da clínica

### Especialidades

#### Listar Especialidades

- **Método:** `GET`
- **URL:** `/api/integrations/specialties`
- **Descrição:** Retorna uma lista de todas as especialidades cadastradas na clínica.
- **Retorno (Sucesso - 200):**
  ```json
  {
    "specialties": ["Cardiologia", "Dermatologia", ...]
  }
  ```

---

## 2. Rotas Internas da API

Estas rotas são usadas pelo frontend da aplicação e requerem autenticação de sessão (cookies).

### Autenticação

- **URL:** `/api/auth/[...all]`
- **Métodos:** `GET`, `POST`
- **Descrição:** Endpoints gerenciados pelo `better-auth` para login, logout, etc.

### Clínica Ativa

- **URL:** `/api/clinics/active`
- **Método:** `GET`
  - **Descrição:** Retorna o ID da clínica ativa do usuário logado.
  - **Retorno:** `{ activeClinicId: string | null }`
- **Método:** `POST`
  - **Descrição:** Define a clínica ativa na sessão/cookie.
  - **Corpo:** `{ "clinicId": "uuid" }`

### Webhooks

- **URL:** `/api/stripe/webhook`
- **Método:** `POST`
  - **Descrição:** Recebe eventos do Stripe (pagamentos, cancelamentos).

---

## 3. Server Actions

Funções executadas no servidor, chamadas diretamente pelos componentes React (Client Components).

### Agendamentos

- **`addAppointment`**
  - **Entrada:** `{ clinicId, clientId, professionalId, date, time, appointmentPriceInCents }`
  - **Descrição:** Cria um agendamento, validando disponibilidade e permissões.
- **`deleteAppointment`**
  - **Entrada:** `{ id, clinicId }`
  - **Descrição:** Remove um agendamento.
- **`getAvailableTimes`**
  - **Entrada:** `{ clinicId, professionalId, date }`
  - **Descrição:** Retorna slots de horário disponíveis para agendamento.

### Clínicas

- **`createClinic`**
  - **Entrada:** `{ name, cnpj, phone, email, addressLine1, addressLine2, city, state, zipCode, nicheId }`
  - **Descrição:** Cria uma nova clínica para o usuário.
- **`updateClinic`**
  - **Entrada:** `{ clinicId, ...dadosDaClinica }`
  - **Descrição:** Atualiza os dados de uma clínica existente.
- **`deleteClinic`**
  - **Entrada:** `clinicId` (string)
  - **Descrição:** Exclui uma clínica e todos os seus dados associados.
- **`getUserClinics`**
  - **Entrada:** Nenhuma (usa sessão).
  - **Descrição:** Retorna lista de clínicas que o usuário possui acesso.

### Clientes

- **`upsertClient`**
  - **Entrada:** `{ clinicId, id?, name, email, phoneNumber, sex, status }`
  - **Descrição:** Cria ou atualiza um cliente. Verifica duplicidade de email/telefone.
- **`deleteClient`**
  - **Entrada:** `{ id, clinicId }`
  - **Descrição:** Remove um cliente.
- **`toggleClientStatus`** (deactivate-client)
  - **Entrada:** `{ id, status, clinicId }`
  - **Descrição:** Altera o status do cliente (ativo/inativo).

### Profissionais

- **`upsertProfessional`**
  - **Entrada:** `{ clinicId, id?, name, specialty, appointmentPriceInCents, availableFromWeekDay, availableToWeekDay, availableFromTime, availableToTime }`
  - **Descrição:** Cria ou atualiza um profissional.
- **`deleteProfessional`**
  - **Entrada:** `{ id, clinicId }`
  - **Descrição:** Remove um profissional.

### Assinatura e Pagamentos

- **`createStripeCheckout`**
  - **Entrada:** `{ planSlug }`
  - **Descrição:** Cria sessão de checkout do Stripe para assinatura de plano.
- **`createStripePortalSession`**
  - **Entrada:** Nenhuma.
  - **Descrição:** Cria sessão do portal do cliente Stripe para gerenciamento de assinatura.

### Chaves de API (Integração)

- **`createApiKey`**
  - **Entrada:** `{ name }`
  - **Descrição:** Gera uma nova API Key para a clínica ativa.
- **`revokeApiKey`**
  - **Entrada:** `{ id }`
  - **Descrição:** Revoga (exclui) uma API Key existente.
