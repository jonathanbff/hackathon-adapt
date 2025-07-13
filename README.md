# Hackathon Adapt - Plataforma de Aprendizagem Adaptativa com IA

Hackathon Adapt é uma plataforma experimental de geração e entrega de conteúdo educacional com inteligência artificial. O projeto combina um backend Python com agentes multi-agente para criação de conteúdo e um frontend Next.js moderno para experiência de aprendizagem interativa.

## 🏗️ Arquitetura do Sistema

### Backend - Sistema Multi-Agente
- **Agentes Especializados**: Geração de conteúdo, flashcards, quizzes e podcasts
- **Orquestração**: LangGraph para coordenação de fluxos de trabalho
- **IA**: OpenAI GPT-4 para geração de conteúdo educacional
- **Processamento**: Modal para execução serverless

### Frontend - Plataforma Web
- **Framework**: Next.js 15 com App Router
- **Stack**: T3 Stack (TypeScript, tRPC, Tailwind CSS)
- **Database**: PostgreSQL com Drizzle ORM
- **Autenticação**: Clerk
- **Background Jobs**: Trigger.dev
- **IA**: Vercel AI SDK com Groq e OpenAI

## 🗄️ Schema Completo do Banco de Dados

### 1. Tabelas Core de Usuário e Perfil

```sql
-- Tabela de autenticação principal
CREATE TABLE "users" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Perfil detalhado do usuário (15 etapas de onboarding)
CREATE TABLE "user_profiles" (
    "user_id" UUID PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
    
    -- Perfil Básico (Etapas 1-7, 15)
    "learning_area" VARCHAR(255),
    "goals" TEXT[],
    "current_level" VARCHAR(100),
    "study_time" VARCHAR(100),
    "learning_style_vark" VARCHAR(100),
    "interests" TEXT[],
    "start_path" VARCHAR(100),

    -- Perfil Estendido (Etapas 8-12, 14)
    "multiple_intelligences" VARCHAR(100)[],
    "learning_motivators" TEXT[],
    "learning_barriers" TEXT[],
    "preferred_devices" VARCHAR(100)[],
    "accessibility_needs" TEXT[],
    "study_schedule" JSONB,
    "content_preferences" VARCHAR(100)[],
    "assessment_style" VARCHAR(100),
    "collaboration_style" VARCHAR(100),
    "gamification_prefs" VARCHAR(100)[],

    -- Personalização (Etapa 13)
    "avatar_style" VARCHAR(100),
    "theme_preference" VARCHAR(50),

    -- Contexto (Etapa 14)
    "educational_background" TEXT,
    "professional_background" TEXT,
    "prior_knowledge_areas" TEXT[],

    "updated_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### 2. Estrutura de Cursos e Conteúdo

```sql
-- Cursos principais
CREATE TABLE "courses" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "creator_id" UUID REFERENCES "users"("id"),
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "target_audience" VARCHAR(255),
    "estimated_duration_hours" INTEGER,
    "status" VARCHAR(50) DEFAULT 'draft' NOT NULL,
    "tags" VARCHAR(50)[],
    "cover_image_url" TEXT,
    "rating" REAL,
    "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Estrutura hierárquica de capítulos
CREATE TABLE "chapters" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "course_id" UUID NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
    "parent_id" UUID REFERENCES "chapters"("id") ON DELETE CASCADE,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Itens de conteúdo genéricos
CREATE TABLE "content_items" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "chapter_id" UUID NOT NULL REFERENCES "chapters"("id") ON DELETE CASCADE,
    "title" VARCHAR(255) NOT NULL,
    "content_type" VARCHAR(50) NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Materiais fonte para cursos
CREATE TABLE "source_materials" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "content_item_id" UUID NOT NULL REFERENCES "content_items"("id") ON DELETE CASCADE,
    "material_type" VARCHAR(50) NOT NULL,
    "storage_path" TEXT NOT NULL,
    "original_filename" VARCHAR(255),
    "transcription" TEXT,
    "duration_seconds" INTEGER,
    "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### 3. Tipos Específicos de Conteúdo

```sql
-- Artigos de texto
CREATE TABLE "articles" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "content_item_id" UUID NOT NULL REFERENCES "content_items"("id") ON DELETE CASCADE,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Decks de flashcards
CREATE TABLE "flashcard_decks" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "content_item_id" UUID NOT NULL REFERENCES "content_items"("id") ON DELETE CASCADE,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Flashcards individuais
CREATE TABLE "flashcards" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "deck_id" UUID NOT NULL REFERENCES "flashcard_decks"("id") ON DELETE CASCADE,
    "front_content" TEXT NOT NULL,
    "back_content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Quizzes
CREATE TABLE "quizzes" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "content_item_id" UUID NOT NULL REFERENCES "content_items"("id") ON DELETE CASCADE,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Questões de quiz
CREATE TABLE "quiz_questions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "quiz_id" UUID NOT NULL REFERENCES "quizzes"("id") ON DELETE CASCADE,
    "question" TEXT NOT NULL,
    "question_type" VARCHAR(50) NOT NULL,
    "options" JSONB,
    "correct_answer" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0
);
```

### 4. Progresso e Interação do Usuário

```sql
-- Inscrições em cursos
CREATE TABLE "user_enrollments" (
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "course_id" UUID NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
    "enrolled_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "last_accessed_at" TIMESTAMPTZ,
    "progress_percentage" REAL DEFAULT 0 NOT NULL,
    "completed_at" TIMESTAMPTZ,
    PRIMARY KEY ("user_id", "course_id")
);

-- Progresso detalhado com repetição espaçada
CREATE TABLE "user_progress" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "content_item_id" UUID NOT NULL REFERENCES "content_items"("id") ON DELETE CASCADE,
    "status" VARCHAR(50) DEFAULT 'not_started' NOT NULL,
    "score" REAL,
    "last_attempt_at" TIMESTAMPTZ,
    "next_review_at" TIMESTAMPTZ,
    "spaced_repetition_interval" INTEGER DEFAULT 1,
    "updated_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE("user_id", "content_item_id")
);
```

### 5. Sistema de Chat e IA

```sql
-- Conversas de chat
CREATE TABLE "chat_conversations" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "course_id" UUID REFERENCES "courses"("id") ON DELETE CASCADE,
    "title" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Mensagens de chat
CREATE TABLE "chat_messages" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "conversation_id" UUID NOT NULL REFERENCES "chat_conversations"("id") ON DELETE CASCADE,
    "role" VARCHAR(50) NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

## 🤖 Fluxo Multi-Agente

### 1. Agente de Geração de Conteúdo (`course_content_agent.py`)
```python
# Responsabilidades:
- Análise do tópico do curso
- Geração de estrutura modular
- Criação de outline detalhado
- Coordenação com outros agentes

# Fluxo:
1. Recebe tópico do curso
2. Gera estrutura JSON com módulos e aulas
3. Salva em course_content.json
4. Dispara agentes de flashcards e quizzes
```

### 2. Agente de Flashcards (`flashcards_agent.py`)
```python
# Responsabilidades:
- Análise do conteúdo do curso
- Geração de perguntas e respostas
- Criação de decks organizados
- Otimização para memorização

# Fluxo:
1. Recebe conteúdo do curso
2. Extrai conceitos-chave
3. Gera pares pergunta-resposta
4. Organiza por módulo/aula
5. Salva em flashcards.json
```

### 3. Agente de Quizzes (`quizzes_agent.py`)
```python
# Responsabilidades:
- Criação de questões de múltipla escolha
- Avaliação de compreensão
- Diferentes níveis de dificuldade
- Feedback personalizado

# Fluxo:
1. Analisa conteúdo do curso
2. Gera questões variadas
3. Cria opções de resposta
4. Define respostas corretas
5. Salva em quiz.json
```

### 4. Agente de Podcast (`podcast.py`)
```python
# Responsabilidades:
- Geração de roteiros conversacionais
- Criação de personas complementares
- Síntese de áudio com OpenAI TTS
- Mixagem profissional

# Fluxo:
1. Analisa conteúdo educacional
2. Gera duas personas brasileiras
3. Cria roteiro conversacional
4. Sintetiza áudio por segmento
5. Mixa e finaliza podcast
```

## 🛠️ Stack Tecnológico Completo

### Backend (Python)
- **LangGraph**: Orquestração de agentes multi-agente
- **LangChain**: Framework de IA para processamento de linguagem natural
- **OpenAI**: GPT-4 para geração de conteúdo educacional
- **Modal**: Execução serverless com escalabilidade automática
- **FastAPI**: API REST para integração com frontend

### Frontend (Next.js 15) - T3 Stack Avançado
- **Framework**: Next.js 15 com App Router e Server Components
- **Language**: TypeScript com tipagem estrita
- **Database**: PostgreSQL + Drizzle ORM com migrações automáticas
- **API**: tRPC para APIs type-safe end-to-end
- **Styling**: Tailwind CSS + shadcn/ui para design system consistente
- **Authentication**: Clerk para autenticação social e tradicional
- **State Management**: TanStack Query para cache e sincronização
- **Background Jobs**: Trigger.dev para processamento assíncrono
- **AI Integration**: Vercel AI SDK com múltiplos provedores
- **File Storage**: Vercel Blob para upload e armazenamento
- **Vector Search**: Upstash Vector para busca semântica
- **Real-time**: WebSockets para chat e notificações

### Sistema de IA e Ferramentas
- **Vercel AI SDK**: Integração unificada com múltiplos LLMs
- **Groq**: LLM de alta velocidade (llama-3.1-8b-instant)
- **OpenAI**: GPT-4 para tarefas complexas
- **Vector Search**: Busca semântica em documentos
- **Web Search**: Integração com DuckDuckGo para informações atuais
- **YouTube Search**: Busca de vídeos educacionais via SearchAPI
- **Spaced Repetition**: Algoritmo SM-2 para memorização otimizada

### Background Jobs (Trigger.dev)
- **Pipeline de Geração de Cursos**: 6 etapas sequenciais
- **Pipeline de Ingestão**: Processamento de documentos PDF
- **Retry Logic**: Configuração robusta de retry com backoff exponencial
- **Monitoring**: Logs detalhados e métricas de performance
- **Task Orchestration**: Coordenação entre tarefas dependentes

### DevOps & Tools
- **Package Manager**: pnpm para instalação rápida e eficiente
- **Linting**: Biome para formatação e linting automático
- **Database Migrations**: Drizzle Kit para versionamento de schema
- **Environment**: @t3-oss/env-nextjs para validação de variáveis
- **Type Safety**: TypeScript strict mode + Zod para validação
- **Error Handling**: TRPC error handling + React Error Boundaries

## 🚀 Configuração e Uso

### Pré-requisitos
- Python 3.10+ para o backend
- Node.js 18+ e `pnpm` para o frontend
- Docker ou Podman para PostgreSQL local
- API keys para OpenAI, Groq e outros serviços

### Backend Setup

1. **Instalar dependências Python:**
```bash
pip install -r backend/requirements.txt
```

2. **Configurar variáveis de ambiente:**
```bash
export OPENAI_API_KEY="sua-chave-openai"
```

3. **Gerar conteúdo de curso:**
```bash
python backend/course_content_agent.py "Tema do curso"
```

4. **Executar API FastAPI (via Modal):**
```bash
python backend/modal_app.py
```

### Frontend Setup

1. **Instalar dependências:**
```bash
cd frontend
pnpm install
```

2. **Configurar banco de dados:**
```bash
./start-database.sh
```

3. **Configurar variáveis de ambiente:**
```bash
# .env
# Database
DATABASE_URL="postgresql://..."

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="..."
CLERK_SECRET_KEY="..."

# AI Providers
OPENAI_API_KEY="..."
GROQ_API_KEY="..."

# Background Jobs (Trigger.dev)
TRIGGER_API_KEY="..."
TRIGGER_API_URL="..."

# File Storage (Vercel Blob)
BLOB_READ_WRITE_TOKEN="..."

# Vector Search (Upstash Vector)
UPSTASH_VECTOR_REST_URL="..."
UPSTASH_VECTOR_REST_TOKEN="..."

# Search APIs
SEARCHAPI_KEY="..."  # Para YouTube Search

# Environment
NODE_ENV="development"
```

4. **Executar migrações:**
```bash
pnpm db:push
```

5. **Iniciar Trigger.dev (opcional):**
```bash
pnpm trigger:dev
```

6. **Iniciar servidor de desenvolvimento:**
```bash
pnpm dev
```

### Comandos Úteis

```bash
# Desenvolvimento
pnpm dev                    # Servidor de desenvolvimento
pnpm build                  # Build para produção
pnpm start                  # Servidor de produção

# Database
pnpm db:generate           # Gerar migrações
pnpm db:push               # Aplicar migrações
pnpm db:studio             # Interface visual do banco

# Background Jobs
pnpm trigger:dev           # Desenvolvimento Trigger.dev
pnpm trigger:deploy        # Deploy Trigger.dev

# Code Quality
pnpm check                 # Verificar código
pnpm check:write           # Formatar código
pnpm typecheck             # Verificar tipos TypeScript
```

## 📁 Estrutura do Projeto

```
hackathon-adapt/
├── backend/                           # Sistema multi-agente Python
│   ├── course_content_agent.py        # Agente principal de conteúdo
│   ├── flashcards_agent.py            # Agente de flashcards
│   ├── quizzes_agent.py               # Agente de quizzes
│   ├── podcast.py                     # Agente de podcasts
│   ├── modal_app.py                   # API FastAPI
│   └── requirements.txt               # Dependências Python
├── frontend/                          # Aplicação Next.js T3 Stack
│   ├── src/
│   │   ├── app/                       # App Router (Next.js 15)
│   │   │   ├── (chat)/                # Route group para chat
│   │   │   ├── (management)/          # Route group para gestão
│   │   │   ├── (top-header)/          # Route group principal
│   │   │   ├── api/                   # API routes
│   │   │   ├── dashboard/             # Dashboard principal
│   │   │   ├── onboarding/            # Fluxo de onboarding
│   │   │   └── layout.tsx             # Layout raiz
│   │   ├── components/                # Componentes React
│   │   │   ├── ui/                    # shadcn/ui components
│   │   │   ├── auth/                  # Componentes de autenticação
│   │   │   ├── chat/                  # Componentes de chat
│   │   │   ├── courses/               # Componentes de cursos
│   │   │   └── onboarding/            # Componentes de onboarding
│   │   ├── server/                    # Lógica backend
│   │   │   ├── api/                   # tRPC routers
│   │   │   │   ├── routers/           # Routers organizados por domínio
│   │   │   │   │   ├── chat.ts        # Chat com IA
│   │   │   │   │   ├── courses.ts     # Gestão de cursos
│   │   │   │   │   ├── course-generation.ts # Geração de cursos
│   │   │   │   │   ├── sources.ts     # Gestão de documentos
│   │   │   │   │   ├── flashcards.ts  # Sistema de flashcards
│   │   │   │   │   └── user/          # Perfis de usuário
│   │   │   │   └── root.ts            # Router principal
│   │   │   ├── db/                    # Database layer
│   │   │   │   ├── connection.ts      # Conexão PostgreSQL
│   │   │   │   ├── schemas/           # Schemas Drizzle ORM
│   │   │   │   │   ├── users.ts       # Usuários e perfis
│   │   │   │   │   ├── courses.ts     # Cursos e conteúdo
│   │   │   │   │   ├── chat.ts        # Chat e mensagens
│   │   │   │   │   ├── assets.ts      # Documentos e mídia
│   │   │   │   │   └── progress.ts    # Progresso e gamification
│   │   │   │   └── index.ts           # Exportações
│   │   │   ├── trigger/               # Background Jobs (Trigger.dev)
│   │   │   │   ├── course-generation/ # Pipeline de geração de cursos
│   │   │   │   │   ├── 00-validate-generation-request.ts
│   │   │   │   │   ├── 01-create-course-structure.ts
│   │   │   │   │   ├── 02-generate-lesson-content.ts
│   │   │   │   │   ├── 03-search-videos.ts
│   │   │   │   │   ├── 04-generate-quizzes.ts
│   │   │   │   │   ├── 05-generate-examples.ts
│   │   │   │   │   ├── 06-finalize-course.ts
│   │   │   │   │   └── main-course-generation-task.ts
│   │   │   │   └── ingestion/         # Pipeline de ingestão de documentos
│   │   │   │       ├── 00-validate-document.ts
│   │   │   │       ├── 01-store-document-blob.ts
│   │   │   │       ├── 02-parse-pdf-to-markdown.ts
│   │   │   │       ├── 03-store-markdown-blob.ts
│   │   │   │       ├── 04-extract-metadata-layout.ts
│   │   │   │       ├── 05-split-and-vectorize.ts
│   │   │   │       └── main-ingestion-task.ts
│   │   │   ├── tools/                 # Ferramentas de IA
│   │   │   │   ├── vector-search.ts   # Busca semântica
│   │   │   │   ├── web-search.ts      # Busca web
│   │   │   │   ├── youtube-search.ts  # Busca YouTube
│   │   │   │   └── groq-ai.ts         # Integração Groq
│   │   │   └── services/              # Serviços de negócio
│   │   │       └── spaced-repetition.ts # Algoritmo SM-2
│   │   ├── trpc/                      # Configuração tRPC
│   │   ├── hooks/                     # Custom hooks
│   │   ├── lib/                       # Utilitários
│   │   ├── styles/                    # Estilos globais
│   │   └── types/                     # Tipos TypeScript
│   ├── drizzle/                       # Migrações do banco
│   ├── public/                        # Assets estáticos
│   ├── trigger.config.ts              # Configuração Trigger.dev
│   ├── drizzle.config.ts              # Configuração Drizzle
│   ├── next.config.js                 # Configuração Next.js
│   ├── biome.jsonc                    # Configuração Biome
│   └── package.json                   # Dependências
└── schema.sql                         # Schema completo PostgreSQL
```

## 🔄 Fluxo de Desenvolvimento Completo

### 1. Geração de Conteúdo (Backend Python)
- **Agente Principal**: Recebe tópico e gera estrutura modular
- **Agentes Especializados**: Flashcards, quizzes e podcasts
- **Orquestração**: LangGraph coordena fluxo multi-agente
- **Output**: JSON estruturado com conteúdo educacional

### 2. Processamento Assíncrono (Trigger.dev)
- **Pipeline de Geração**: 6 etapas sequenciais para criação de cursos
- **Pipeline de Ingestão**: Processamento de documentos PDF
- **Retry Logic**: Tratamento robusto de falhas
- **Monitoring**: Logs detalhados e métricas

### 3. Armazenamento e Indexação
- **Database**: PostgreSQL com Drizzle ORM
- **Vector Search**: Upstash Vector para busca semântica
- **File Storage**: Vercel Blob para documentos e mídia
- **Migrations**: Drizzle Kit para versionamento de schema

### 4. Interface Web (Next.js 15)
- **App Router**: Roteamento moderno com Server Components
- **tRPC**: APIs type-safe end-to-end
- **TanStack Query**: Cache inteligente e sincronização
- **shadcn/ui**: Design system consistente

### 5. Sistema de Aprendizagem
- **Progresso**: Tracking individual de avanço
- **Spaced Repetition**: Algoritmo SM-2 para memorização
- **Gamification**: Sistema de recompensas e badges
- **Personalização**: Adaptação baseada no perfil do usuário

### 6. IA Conversacional e Ferramentas
- **Chat com IA**: Integração com Groq e OpenAI
- **Vector Search**: Busca em documentos carregados
- **Web Search**: Informações atuais via DuckDuckGo
- **YouTube Search**: Vídeos educacionais relevantes

## 🎯 Funcionalidades Principais

### 🎓 Geração de Conteúdo Educacional
- **Geração Automática de Cursos**: IA cria estrutura completa com módulos e aulas
- **Flashcards Inteligentes**: Sistema de memorização com algoritmo SM-2
- **Quizzes Adaptativos**: Avaliação personalizada baseada no progresso
- **Podcasts Educacionais**: Conteúdo em áudio com personas brasileiras
- **Busca de Vídeos**: Integração com YouTube para conteúdo visual

### 🤖 Sistema de IA Avançado
- **Chat Conversacional**: Suporte com Groq (alta velocidade) e OpenAI (alta qualidade)
- **Vector Search**: Busca semântica em documentos carregados
- **Web Search**: Informações atuais via DuckDuckGo
- **Processamento de PDFs**: Extração e indexação automática de documentos
- **Geração de Títulos**: IA gera títulos automáticos para conversas

### 📊 Sistema de Aprendizagem
- **Progresso Personalizado**: Tracking individual de avanço
- **Spaced Repetition**: Algoritmo SM-2 para memorização otimizada
- **Gamification**: Sistema de recompensas, badges e progresso visual
- **Perfis de Usuário**: 15 etapas de onboarding personalizado
- **Adaptação de Conteúdo**: Baseada no estilo de aprendizagem

### 🔄 Background Processing
- **Pipeline de Geração**: 6 etapas sequenciais para criação de cursos
- **Pipeline de Ingestão**: Processamento assíncrono de documentos
- **Retry Logic**: Tratamento robusto de falhas com backoff exponencial
- **Monitoring**: Logs detalhados e métricas de performance

### 🎨 Interface Moderna
- **Design System**: shadcn/ui com Tailwind CSS
- **Responsive**: Interface adaptável para mobile e desktop
- **Dark/Light Mode**: Suporte a temas personalizáveis
- **Real-time Updates**: Atualizações em tempo real via WebSockets
- **Type Safety**: TypeScript strict mode + Zod para validação

---

**Nota**: Este é um projeto de hackathon experimental e é fornecido como está.
