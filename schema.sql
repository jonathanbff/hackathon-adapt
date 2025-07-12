-- ####################################################################
-- #                                                                    #
-- #        PostgreSQL Schema for EDUONE Adaptive Learning Platform     #
-- #         (Consolidated with "EDUONE - Schema Completo")             #
-- #                                                                    #
-- ####################################################################

-- ####################################################################
-- # 1. Core User & Profile Tables
-- ####################################################################

-- Tabela de autenticação principal.
CREATE TABLE "users" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Tabela detalhada para o perfil do utilizador, baseada no fluxo de Onboarding de 15 etapas.
CREATE TABLE "user_profiles" (
    "user_id" UUID PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
    
    -- Perfil Básico (Onboarding Steps 1-7, 15)
    "learning_area" VARCHAR(255), -- e.g., 'Tecnologia', 'Artes'
    "goals" TEXT[], -- e.g., ARRAY['Aprender uma nova habilidade', 'Avançar na carreira']
    "current_level" VARCHAR(100), -- e.g., 'Iniciante', 'Intermediário'
    "study_time" VARCHAR(100), -- e.g., '30 minutos/dia'
    "learning_style_vark" VARCHAR(100), -- 'Visual', 'Auditivo', 'Leitura/Escrita', 'Cinestésico'
    "interests" TEXT[],
    "start_path" VARCHAR(100), -- e.g., 'Curso recomendado', 'Explorar catálogo'

    -- Perfil Estendido (Onboarding Steps 8-12, 14)
    "multiple_intelligences" VARCHAR(100)[], -- Gardner's intelligences
    "learning_motivators" TEXT[],
    "learning_barriers" TEXT[],
    "preferred_devices" VARCHAR(100)[],
    "accessibility_needs" TEXT[],
    "study_schedule" JSONB, -- e.g., '{"monday": "19:00-20:00", "wednesday": "18:00-19:00"}'
    "content_preferences" VARCHAR(100)[], -- e.g., 'Vídeos curtos', 'Artigos aprofundados'
    "assessment_style" VARCHAR(100),
    "collaboration_style" VARCHAR(100),
    "gamification_prefs" VARCHAR(100)[],

    -- Personalização (Onboarding Step 13)
    "avatar_style" VARCHAR(100),
    "theme_preference" VARCHAR(50), -- 'light', 'dark', 'system'

    -- Contexto (Onboarding Step 14)
    "educational_background" TEXT,
    "professional_background" TEXT,
    "prior_knowledge_areas" TEXT[],

    "updated_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);


-- ####################################################################
-- # 2. Course Structure & Content Tables
-- ####################################################################

CREATE TABLE "courses" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "creator_id" UUID REFERENCES "users"("id"), -- User who created the course
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "target_audience" VARCHAR(255),
    "estimated_duration_hours" INTEGER,
    "status" VARCHAR(50) DEFAULT 'draft' NOT NULL, -- 'draft', 'published', 'archived'
    "tags" VARCHAR(50)[], -- For filtering in 'Catálogo de Cursos'
    "cover_image_url" TEXT,
    "rating" REAL, -- Average rating
    "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Suporta a estrutura em árvore para "Roadmap" e "Mapa Mental".
CREATE TABLE "chapters" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "course_id" UUID NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
    "parent_id" UUID REFERENCES "chapters"("id") ON DELETE CASCADE, -- Self-reference for tree structure
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Item de conteúdo genérico dentro de um capítulo.
CREATE TABLE "content_items" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "chapter_id" UUID NOT NULL REFERENCES "chapters"("id") ON DELETE CASCADE,
    "title" VARCHAR(255) NOT NULL,
    "content_type" VARCHAR(50) NOT NULL, -- 'video', 'article', 'quiz', 'flashcard_deck', 'activity'
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Tabela para os materiais enviados durante a criação do curso.
CREATE TABLE "source_materials" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "content_item_id" UUID NOT NULL REFERENCES "content_items"("id") ON DELETE CASCADE,
    "material_type" VARCHAR(50) NOT NULL, -- 'pdf', 'video', 'audio', 'image', 'doc'
    "storage_path" TEXT NOT NULL, -- e.g., path in Supabase Storage
    "original_filename" VARCHAR(255),
    "transcription" TEXT, -- For video/audio files
    "duration_seconds" INTEGER,
    "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ####################################################################
-- # 3. Specific Content Type Tables
-- ####################################################################

CREATE TABLE "articles" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "content_item_id" UUID NOT NULL REFERENCES "content_items"("id") ON DELETE CASCADE,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE "flashcard_decks" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "content_item_id" UUID NOT NULL REFERENCES "content_items"("id") ON DELETE CASCADE,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE "flashcards" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "deck_id" UUID NOT NULL REFERENCES "flashcard_decks"("id") ON DELETE CASCADE,
    "front_content" TEXT NOT NULL,
    "back_content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE "quizzes" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "content_item_id" UUID NOT NULL REFERENCES "content_items"("id") ON DELETE CASCADE,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE "quiz_questions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "quiz_id" UUID NOT NULL REFERENCES "quizzes"("id") ON DELETE CASCADE,
    "question" TEXT NOT NULL,
    "question_type" VARCHAR(50) NOT NULL, -- 'multiple-choice', 'true-false'
    "options" JSONB,
    "correct_answer" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0
);

-- ####################################################################
-- # 4. User Progress & Interaction
-- ####################################################################

CREATE TABLE "user_enrollments" (
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "course_id" UUID NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
    "enrolled_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "last_accessed_at" TIMESTAMPTZ,
    "progress_percentage" REAL DEFAULT 0 NOT NULL,
    "completed_at" TIMESTAMPTZ,
    PRIMARY KEY ("user_id", "course_id")
);

CREATE TABLE "user_progress" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "content_item_id" UUID NOT NULL REFERENCES "content_items"("id") ON DELETE CASCADE,
    "status" VARCHAR(50) DEFAULT 'not_started' NOT NULL, -- 'not_started', 'completed'
    "score" REAL,
    "last_attempt_at" TIMESTAMPTZ,
    "next_review_at" TIMESTAMPTZ, -- For spaced repetition
    "spaced_repetition_interval" INTEGER DEFAULT 1, -- in days
    "updated_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE("user_id", "content_item_id")
);

-- ####################################################################
-- # 5. AI & Chat Features (Potentially Non-MVP)
-- ####################################################################

-- MVP FLAG: Chat functionality is a major feature set on its own.
CREATE TABLE "chat_conversations" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "course_id" UUID REFERENCES "courses"("id") ON DELETE CASCADE, -- Context for the chat
    "title" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE "chat_messages" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "conversation_id" UUID NOT NULL REFERENCES "chat_conversations"("id") ON DELETE CASCADE,
    "role" VARCHAR(50) NOT NULL, -- 'user', 'assistant', 'Professor AI', 'Arquiteto AI', etc.
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
