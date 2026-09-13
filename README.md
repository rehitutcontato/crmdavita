# Davita Intelligence Suite — CRM Preditivo & Retail Media
### Rede Davita de Supermercados (by Parvus Space)

Protótipo full-stack funcional de alta fidelidade do Motor de CRM Preditivo e Monetização Retail Media para a Rede Davita de Supermercados.

---

## 🚀 Como Executar o Sistema

O sistema é composto por duas camadas em processos independentes:
1. **Backend (Python / FastAPI + Motor de Simulação 24/7)**
2. **Frontend (Next.js 14+ / TypeScript / Tailwind CSS)**

---

### 1. Pré-requisitos
- Python 3.11+ instalado (`py` ou `python`)
- Node.js 18+ e npm instalados

---

### 2. Inicializando o Backend (FastAPI)

Abra um terminal na pasta `backend`:

```powershell
cd backend
py -m pip install -r requirements.txt
py -m uvicorn app.main:app --reload --port 8000
```

> **API REST:** `http://localhost:8000`  
> **Docs Swagger:** `http://localhost:8000/docs`  
> **WebSocket Stream:** `ws://localhost:8000/ws/live`

---

### 3. Inicializando o Frontend (Next.js)

Abra um segundo terminal na pasta `frontend`:

```powershell
cd frontend
npm install
npm run dev
```

> **Acesse no navegador:** `http://localhost:3000`

---

## ⚙️ Variáveis de Ambiente (Frontend)

Opcionalmente, crie um arquivo `.env.local` na pasta `frontend/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

---

## 🎯 Roteiro de Demonstração para a Diretoria

1. **Login Executivo:**
   - Acesse `http://localhost:3000`.
   - A tela aceita qualquer usuário/senha ou em branco. Clique em **"Acessar Painel Executivo"**.
2. **Painel da Diretoria:**
   - Observe os números de faturamento, cupons e ticket médio incrementando suavemente em tempo real com as transações dos caixas.
   - Veja o **Bloco 2 (CRM Preditivo & Retail Media)** com o comparativo de ticket médio com e sem oferta (+18.5% basket lift) e o volume de descontos 100% bancado pela indústria parceira.
   - Analise o **Funil de Conversão & Breakage**, demonstrando a blindagem de margem da rede.
3. **Mágica ao Vivo entre Telas (App Cliente ↔ Diretoria):**
   - Use o seletor superior para alternar para o **App Cliente** ou use a opção **"Lado a Lado"**.
   - No App Cliente, ative uma das ofertas com o botão **"Ativar Oferta no Meu CPF"** (ex: Cerveja Ambev ou Iogurte Danone).
   - No Painel Diretoria, veja a contagem de ofertas ativadas e o funil atualizarem instantaneamente via WebSocket sem recarregar a página.
   - Clique em **"Simular Compra no Caixa"** no celular e veja a oferta ser resgatada no caixa, gerando receita incremental imediata no BI.
4. **Radar de Churn Silencioso:**
   - No Bloco 3, localize o cliente Mariana Oliveira (ou outro com desvio crítico) e clique em **"Disparar Push Retenção"**.
   - Na tela do smartphone (Visão Cliente), veja a notificação push nativa animada aparecer instantaneamente no topo do aparelho com copy persuasivo.
5. **Controles de Simulação:**
   - No topo do painel executivo, teste pausar a simulação (os contadores congelam), acelerar para 2x, 4x ou 8x, ou reiniciar os dados do dia com **"Resetar Demo"**.

---

## 🏛️ Arquitetura do Sistema

```
davita-crm-prototype/
├── backend/                  # FastAPI + Motor de Simulação
│   ├── app/
│   │   ├── main.py           # Lifespan, CORS, Rotas e WebSocket
│   │   ├── models/           # Schemas de domínio Pydantic v2
│   │   ├── simulation/       # Loop A (Transações), Loop B (Churn), Loop C (Expiração), Clock
│   │   ├── routers/          # Endpoints REST (/dashboard, /stores, /offers, /churn-alerts, etc.)
│   │   ├── ws/               # WebSocket Manager para broadcast em tempo real
│   │   ├── data/             # Seed completo (6 lojas, 30 produtos, 150 clientes com histórico 60 dias)
│   │   └── state/            # Store central de estado mutável (fonte única da verdade)
│   └── requirements.txt
├── frontend/                 # Next.js 14+ / Tailwind CSS / TypeScript
│   ├── src/
│   │   ├── app/              # App Router (Login Gate, Dashboard Shell)
│   │   ├── components/       # NavSwitch, App Cliente, Painel Diretoria, UI
│   │   ├── hooks/            # useLiveStore (Singleton WebSocket via React Context)
│   │   └── lib/              # Cliente de API tipado
└── README.md
```
