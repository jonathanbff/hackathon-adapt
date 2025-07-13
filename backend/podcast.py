#!/usr/bin/env python3
"""
Sistema de Geração de Podcasts com IA
Gera podcasts com duas pessoas conversando a partir de conteúdo fornecido
"""

import os
import json


from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
from dotenv import load_dotenv
import openai
import tempfile


# Carrega variáveis de ambiente
load_dotenv()

class VoiceType(Enum):
    """Tipos de voz disponíveis - 11 vozes da OpenAI"""
    ALLOY = "alloy"      # Voz neutra e clara
    ASH = "ash"          # Nova voz versátil
    BALLAD = "ballad"    # Nova voz melodiosa
    CORAL = "coral"      # Nova voz quente
    ECHO = "echo"        # Voz masculina profissional
    FABLE = "fable"      # Voz feminina expressiva
    NOVA = "nova"        # Voz feminina jovem
    ONYX = "onyx"        # Voz masculina profunda
    SAGE = "sage"        # Nova voz sábia
    SHIMMER = "shimmer"  # Voz feminina suave

class ToneType(Enum):
    """Tipos de tom para o podcast"""
    CASUAL = "casual"
    PROFESSIONAL = "professional"
    EDUCATIONAL = "educational"
    ENTERTAINING = "entertaining"
    TECHNICAL = "technical"
    STORYTELLING = "storytelling"

@dataclass
class Persona:
    """Representa uma persona do podcast"""
    name: str
    role: str
    personality: str
    expertise: str
    voice: VoiceType
    tone: ToneType
    speaking_style: str
    background: str

@dataclass
class PodcastSegment:
    """Representa um segmento do podcast"""
    speaker: str
    text: str
    audio_path: Optional[str] = None
    timestamp: float = 0.0
    duration: float = 0.0

@dataclass
class PodcastConfig:
    """Configuração do podcast"""
    title: str
    topic: str
    duration_minutes: int
    tone: ToneType
    target_audience: str
    format_style: str
    intro_music: bool = False
    outro_music: bool = False

class ContentAnalyzer:
    """Analisa conteúdo e extrai informações relevantes"""

    def __init__(self, openai_client):
        self.client = openai_client

    def analyze_content(self, content: str) -> Dict[str, Any]:
        """Analisa o conteúdo e extrai tópicos, tom e estrutura"""

        analysis_prompt = f"""
        Analise o seguinte conteúdo e forneça uma estrutura detalhada para um podcast EM PORTUGUÊS BRASILEIRO:

        CONTEÚDO:
        {content}

        IMPORTANTE: Todo o conteúdo deve ser em PORTUGUÊS BRASILEIRO.

        Forneça uma análise em JSON com:
        1. topic: tópico principal (em português)
        2. key_points: 5-8 pontos principais (em português)
        3. target_audience: público-alvo (em português)
        4. recommended_tone: tom recomendado (casual, professional, educational, etc.)
        5. complexity_level: nível de complexidade (1-5)
        6. estimated_duration: duração estimada em minutos
        7. discussion_angles: diferentes ângulos para discutir o tema (em português)
        8. questions_to_explore: perguntas interessantes para explorar (em português)
        9. examples_and_stories: exemplos e histórias relevantes (em português)
        10. actionable_insights: insights práticos para o público (em português)

        Responda APENAS com JSON válido em português brasileiro.
        """

        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "Você é um especialista em análise de conteúdo e produção de podcasts. Analise o conteúdo fornecido e retorne apenas JSON válido."},
                    {"role": "user", "content": analysis_prompt}
                ],
                temperature=0.7
            )

            return json.loads(response.choices[0].message.content)

        except Exception as e:
            print(f"❌ Erro na análise: {e}")
            return {
                "topic": "Tópico não identificado",
                "key_points": ["Ponto principal"],
                "target_audience": "Público geral",
                "recommended_tone": "casual",
                "complexity_level": 3,
                "estimated_duration": 2,
                "discussion_angles": ["Visão geral"],
                "questions_to_explore": ["Como isso funciona?"],
                "examples_and_stories": ["Exemplo prático"],
                "actionable_insights": ["Dica prática"]
            }

class PersonaGenerator:
    """Gerador de personas para o podcast"""

    def __init__(self, openai_client):
        self.client = openai_client

    def _detect_gender_and_assign_voice(self, name: str) -> VoiceType:
        """Detecta o gênero baseado no nome e atribui voz apropriada"""
        # Nomes masculinos comuns brasileiros
        masculine_names = {
            'ricardo', 'carlos', 'joão', 'antonio', 'francisco', 'paulo', 'pedro', 'lucas',
            'marcos', 'rafael', 'fernando', 'bruno', 'rodrigo', 'daniel', 'felipe', 'thiago',
            'leonardo', 'gustavo', 'eduardo', 'andre', 'andré', 'diego', 'marcelo', 'alexandre', 'sergio',
            'joao', 'antônio', 'joão', 'mateus', 'matheus', 'vinicius', 'vinícius', 'caio', 'gabriel'
        }

        # Nomes femininos comuns brasileiros
        feminine_names = {
            'fernanda', 'ana', 'maria', 'juliana', 'carla', 'patricia', 'sandra', 'claudia',
            'monica', 'andrea', 'luciana', 'renata', 'cristina', 'paula', 'amanda', 'bruna',
            'carolina', 'priscila', 'vanessa', 'camila', 'jessica', 'mariana', 'gabriela', 'isabela',
            'laura', 'leticia', 'letícia', 'beatriz', 'bianca', 'natalia', 'natália', 'raquel', 'sabrina'
        }

        # Pega o primeiro nome e normaliza
        first_name = name.split()[0].lower().strip()

        # Verifica se é masculino
        if first_name in masculine_names:
            # Alterna entre as duas vozes masculinas
            return VoiceType.ECHO if hash(name) % 2 == 0 else VoiceType.ONYX

        # Verifica se é feminino
        if first_name in feminine_names:
            # Alterna entre as três vozes femininas
            voice_options = [VoiceType.FABLE, VoiceType.NOVA, VoiceType.SHIMMER]
            return voice_options[hash(name) % len(voice_options)]

        # Fallback: tenta detectar por terminação comum
        if first_name.endswith(('o', 'os', 'ro', 'do', 'to')):
            return VoiceType.ECHO  # Masculino
        elif first_name.endswith(('a', 'as', 'na', 'da', 'ta')):
            return VoiceType.FABLE  # Feminino

        # Fallback final: usa voz neutra
        return VoiceType.ALLOY

    def generate_personas(self, content_analysis: Dict[str, Any], config: PodcastConfig) -> Tuple[Persona, Persona]:
        """Gera duas personas complementares para o podcast"""

        persona_prompt = f"""
        Baseado na análise de conteúdo, crie duas personas complementares para apresentar um podcast EM PORTUGUÊS BRASILEIRO:

        ANÁLISE DO CONTEÚDO:
        - Tópico: {content_analysis['topic']}
        - Público-alvo: {content_analysis['target_audience']}
        - Tom: {config.tone.value}
        - Complexidade: {content_analysis['complexity_level']}/5
        - Formato: {config.format_style}

        IMPORTANTE:
        - Use NOMES BRASILEIROS para as personas
        - GARANTA CONSISTÊNCIA DE GÊNERO: nome masculino = persona masculina, nome feminino = persona feminina
        - Todo conteúdo deve ser em PORTUGUÊS BRASILEIRO
        - As personas devem soar naturais para o público brasileiro

        Crie duas personas que se complementem:
        1. Uma mais especialista/técnica
        2. Uma mais questionadora/representando o público

        Para cada persona, forneça:
        - name: nome brasileiro típico (seja consistente com o gênero)
        - role: papel no podcast (ex: "Especialista", "Mediadora")
        - personality: personalidade em português
        - expertise: área de especialização em português
        - speaking_style: estilo de fala em português
        - background: contexto profissional brasileiro

        Responda APENAS em JSON com estrutura:
        {{
            "persona1": {{ "name": "...", "role": "...", etc }},
            "persona2": {{ "name": "...", "role": "...", etc }}
        }}
        """

        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "Você é um especialista em criação de personas para podcasts. Crie personas autênticas e complementares com consistência de gênero."},
                    {"role": "user", "content": persona_prompt}
                ],
                temperature=0.8
            )

            personas_data = json.loads(response.choices[0].message.content)

            # Cria personas com vozes baseadas no gênero
            persona1 = Persona(
                voice=self._detect_gender_and_assign_voice(personas_data['persona1']['name']),
                tone=config.tone,
                **personas_data['persona1']
            )

            persona2 = Persona(
                voice=self._detect_gender_and_assign_voice(personas_data['persona2']['name']),
                tone=config.tone,
                **personas_data['persona2']
            )

            return persona1, persona2

        except Exception as e:
            print(f"❌ Erro na geração de personas: {e}")
            # Fallback
            return self._get_default_personas(config)

    def _get_default_personas(self, config: PodcastConfig) -> Tuple[Persona, Persona]:
        """Personas padrão caso haja erro - com consistência de gênero"""
        persona1 = Persona(
            name="Ana Paula",
            role="Especialista",
            personality="Analítica e didática, com sotaque brasileiro natural",
            expertise="Conhecimento técnico profundo com experiência brasileira",
            voice=VoiceType.FABLE,  # Voz feminina expressiva para Ana Paula
            tone=config.tone,
            speaking_style="Clara e estruturada, fala em português brasileiro",
            background="Profissional brasileira experiente"
        )

        persona2 = Persona(
            name="Ricardo",
            role="Mediador",
            personality="Curioso e questionador, com jeito brasileiro de falar",
            expertise="Comunicação e síntese com foco no público brasileiro",
            voice=VoiceType.ECHO,    # Voz masculina profissional para Ricardo
            tone=config.tone,
            speaking_style="Conversacional e envolvente, típico brasileiro",
            background="Comunicador brasileiro experiente"
        )

        return persona1, persona2

class UnifiedScriptGenerator:
    """Gerador de roteiro unificado - um único agente responsável por todo o roteiro"""

    def __init__(self, openai_client):
        self.client = openai_client

    def generate_complete_script(
        self,
        content_analysis: Dict[str, Any],
        persona1: Persona,
        persona2: Persona,
        config: PodcastConfig
    ) -> List[PodcastSegment]:
        """Gera o roteiro completo do podcast com um único agente"""

        # Calcula número ideal de segmentos baseado na duração
        duration_minutes = config.duration_minutes
        if duration_minutes <= 1:
            target_segments = 4  # Para 45s-1min
        elif duration_minutes <= 2:
            target_segments = 6  # Para 2min
        else:
            target_segments = max(6, int(duration_minutes * 3))  # ~3 segmentos por minuto

        script_prompt = f"""
        Você é um roteirista especializado em podcasts brasileiros. Crie um roteiro COMPLETO em PORTUGUÊS BRASILEIRO para um podcast de {config.duration_minutes} minutos.

        CONFIGURAÇÃO:
        - Título: {config.title}
        - Tópico: {content_analysis['topic']}
        - Tom: {config.tone.value}
        - Formato: {config.format_style}
        - Público: {content_analysis['target_audience']}
        - Duração alvo: {duration_minutes} minutos (~{target_segments} segmentos)

        APRESENTADORES BRASILEIROS:
        - {persona1.name} ({persona1.role}): {persona1.personality}
        - {persona2.name} ({persona2.role}): {persona2.personality}

        PONTOS PRINCIPAIS A COBRIR:
        {json.dumps(content_analysis['key_points'], indent=2, ensure_ascii=False)}

        INSTRUÇÕES CRÍTICAS:
        1. TODO O DIÁLOGO deve ser em PORTUGUÊS BRASILEIRO natural
        2. Use expressões, gírias e jeito brasileiro de falar
        3. Evite termos muito técnicos em inglês
        4. Mantenha consistência de idioma do início ao fim
        5. {persona1.name} deve falar de forma {persona1.speaking_style}
        6. {persona2.name} deve falar de forma {persona2.speaking_style}

        ESTRUTURA PARA {duration_minutes} MINUTOS:
        - Abertura rápida (10-15% do tempo)
        - Desenvolvimento dos pontos principais (70-80% do tempo)
        - Encerramento (5-10% do tempo)

        Crie exatamente {target_segments} segmentos alternando entre os apresentadores.
        Cada segmento deve ter 1-3 frases para caber no tempo.

        FORMATO DE SAÍDA (JSON):
        {{
            "segments": [
                {{
                    "speaker": "{persona1.name}",
                    "text": "Olá pessoal, bem-vindos ao nosso podcast! Eu sou {persona1.name}..."
                }},
                {{
                    "speaker": "{persona2.name}",
                    "text": "E eu sou {persona2.name}! Hoje vamos falar sobre..."
                }}
            ]
        }}

        RESPONDA APENAS COM JSON VÁLIDO EM PORTUGUÊS BRASILEIRO.
        """

        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "Você é um roteirista especializado em podcasts brasileiros. Crie conversas naturais e envolventes SEMPRE em português brasileiro. Mantenha consistência de idioma do início ao fim."},
                    {"role": "user", "content": script_prompt}
                ],
                temperature=0.7,
                max_tokens=4000
            )

            script_data = json.loads(response.choices[0].message.content)

            # Converte para objetos PodcastSegment com validação de idioma
            segments = []
            for segment_data in script_data['segments']:
                text = segment_data['text']

                # Validação básica de idioma (verifica se tem muito inglês)
                if self._validate_portuguese_text(text):
                    segment = PodcastSegment(
                        speaker=segment_data['speaker'],
                        text=text
                    )
                    segments.append(segment)
                else:
                    print(f"⚠️ Segmento com possível problema de idioma detectado: {text[:50]}...")
                    # Corrige o texto para português
                    corrected_text = self._ensure_portuguese(text, segment_data['speaker'])
                    segment = PodcastSegment(
                        speaker=segment_data['speaker'],
                        text=corrected_text
                    )
                    segments.append(segment)

            return segments

        except Exception as e:
            print(f"❌ Erro na geração do roteiro: {e}")
            return self._get_default_script(persona1, persona2, config)

    def _validate_portuguese_text(self, text: str) -> bool:
        """Validação básica se o texto está em português"""
        # Lista de palavras comuns em inglês que não deveriam aparecer
        english_words = ['the', 'and', 'that', 'with', 'for', 'this', 'you', 'are', 'have', 'was', 'were', 'been', 'will', 'would']
        text_lower = text.lower()

        english_count = sum(1 for word in english_words if f' {word} ' in text_lower)
        return english_count <= 2  # Permite até 2 palavras em inglês (pode ser técnicas)

    def _ensure_portuguese(self, text: str, speaker: str) -> str:
        """Garante que o texto esteja em português"""
        # Substitui algumas expressões comuns
        corrections = {
            'hello': 'olá',
            'hi': 'oi',
            'thank you': 'obrigado',
            'thanks': 'obrigado',
            'welcome': 'bem-vindos',
            'today': 'hoje',
            'let\'s': 'vamos',
            'great': 'ótimo'
        }

        corrected = text
        for en, pt in corrections.items():
            corrected = corrected.replace(en, pt)

        return corrected

    def _get_default_script(self, persona1: Persona, persona2: Persona, config: PodcastConfig) -> List[PodcastSegment]:
        """Roteiro padrão caso haja erro"""
        return [
            PodcastSegment(
                speaker=persona1.name,
                text=f"Olá pessoal, bem-vindos ao nosso podcast! Eu sou {persona1.name}."
            ),
            PodcastSegment(
                speaker=persona2.name,
                text=f"E eu sou {persona2.name}! Hoje vamos falar sobre {config.topic}."
            ),
            PodcastSegment(
                speaker=persona1.name,
                text="Vamos começar explorando os aspectos principais deste tema."
            ),
            PodcastSegment(
                speaker=persona2.name,
                text="Excelente! Obrigado por nos acompanhar até aqui."
            )
        ]

class AudioGenerator:
    """Gera áudio para cada segmento do podcast"""

    def __init__(self, openai_client):
        self.client = openai_client
        self.temp_dir = tempfile.mkdtemp()

    def generate_audio_for_segment(self, segment: PodcastSegment, persona: Persona) -> str:
        """Gera áudio para um segmento específico"""

        import time
        import hashlib

        max_retries = 3
        retry_delay = 2

        for attempt in range(max_retries):
            try:
                # Trunca texto se muito longo (limite da API)
                text = segment.text[:4000] if len(segment.text) > 4000 else segment.text

                # Gera áudio usando OpenAI TTS mais recente com instruções de idioma
                print(f"    🎤 Gerando voz {persona.voice.value} para: {text[:50]}...")

                # Instruções específicas para português brasileiro
                voice_instructions = f"""
                Fale em português brasileiro natural e fluente.
                Use sotaque brasileiro típico.
                Mantenha {persona.speaking_style}.
                Evite sotaque estrangeiro.
                """

                response = self.client.audio.speech.create(
                    model="gpt-4o-mini-tts",  # Modelo mais recente
                    voice=persona.voice.value,
                    input=text,
                    instructions=voice_instructions.strip(),
                    speed=1.0,
                    timeout=60  # 60 segundos timeout
                )

                # Cria nome único para arquivo
                text_hash = hashlib.md5(text.encode()).hexdigest()[:8]
                audio_path = os.path.join(self.temp_dir, f"segment_{text_hash}_{persona.voice.value}.mp3")

                # Salva arquivo
                response.stream_to_file(audio_path)

                # Verifica se arquivo foi criado
                if not os.path.exists(audio_path) or os.path.getsize(audio_path) == 0:
                    raise Exception("Arquivo de áudio vazio ou não criado")

                # Atualiza informações do segmento
                segment.audio_path = audio_path
                segment.duration = self._get_audio_duration(audio_path)

                print(f"    ✅ Áudio salvo: {os.path.basename(audio_path)} ({segment.duration:.1f}s)")
                return audio_path

            except Exception as e:
                print(f"    ⚠️ Tentativa {attempt + 1}/{max_retries} falhou: {e}")

                if attempt < max_retries - 1:
                    print(f"    ⏳ Aguardando {retry_delay}s antes de tentar novamente...")
                    time.sleep(retry_delay)
                    retry_delay *= 2  # Backoff exponencial
                else:
                    print(f"    ❌ Falha definitiva após {max_retries} tentativas")
                    # Cria arquivo vazio como fallback
                    fallback_path = os.path.join(self.temp_dir, f"fallback_{hash(segment.text)}.txt")
                    with open(fallback_path, 'w', encoding='utf-8') as f:
                        f.write(f"ERRO: Não foi possível gerar áudio para:\n{segment.text}")
                    segment.audio_path = fallback_path
                    return fallback_path

    def _get_audio_duration(self, audio_path: str) -> float:
        """Obtém duração do arquivo de áudio"""
        try:
            # Tenta usar audio_utils se disponível
            try:
                from audio_utils import AudioProcessor
                processor = AudioProcessor()
                info = processor.get_audio_info(audio_path)
                return info.get('duration', 5.0)
            except ImportError:
                pass

            # Fallback: estima baseado no tamanho do arquivo
            file_size = os.path.getsize(audio_path)
            # Estimativa aproximada: 1KB por segundo de áudio MP3
            estimated_duration = file_size / 1024  # rough estimate
            return max(1.0, min(estimated_duration, 60.0))  # entre 1 e 60 segundos

        except Exception as e:
            print(f"⚠️  Erro ao calcular duração: {e}")
            return 5.0

class PodcastAssembler:
    """Monta o podcast final combinando todos os áudios"""

    def __init__(self):
        self.temp_dir = tempfile.mkdtemp()

        # Importa audio_utils se disponível
        try:
            from audio_utils import AudioProcessor, PodcastMixer
            self.audio_processor = AudioProcessor()
            self.mixer = PodcastMixer()
            self.audio_available = True
        except ImportError:
            self.audio_available = False
            print("⚠️  audio_utils não disponível. Usando simulação.")

    def assemble_podcast(self, segments: List[PodcastSegment], config: PodcastConfig) -> str:
        """Combina todos os segmentos em um podcast final"""

        try:
            output_path = os.path.join(self.temp_dir, f"podcast_{config.title.replace(' ', '_')}.mp3")

            print(f"🎧 Montando podcast: {config.title}")
            print(f"📁 Caminho de saída: {output_path}")

            # Coleta arquivos de áudio válidos
            audio_files = []
            for segment in segments:
                if segment.audio_path and os.path.exists(segment.audio_path):
                    audio_files.append(segment.audio_path)

            if not audio_files:
                print("❌ Nenhum arquivo de áudio válido encontrado")
                return self._create_fallback_file(output_path, segments)

            # Usa processador de áudio se disponível
            if self.audio_available:
                return self.audio_processor.concatenate_audio_files(
                    audio_files,
                    output_path,
                    add_silence=True,
                    silence_duration=800  # ms entre segmentos
                )
            else:
                return self._create_fallback_file(output_path, segments)

        except Exception as e:
            print(f"❌ Erro na montagem: {e}")
            return self._create_fallback_file(output_path, segments)

    def _create_fallback_file(self, output_path: str, segments: List[PodcastSegment]) -> str:
        """Cria arquivo de fallback quando não consegue concatenar"""

        try:
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write("# Podcast Gerado por IA\n")
                f.write("# Roteiro completo do podcast\n\n")

                for i, segment in enumerate(segments):
                    f.write(f"## Segmento {i+1} - {segment.speaker}\n")
                    f.write(f"{segment.text}\n\n")

                    if segment.audio_path:
                        f.write(f"Arquivo de áudio: {segment.audio_path}\n\n")

                f.write("---\n")
                f.write("Para ouvir o podcast completo, instale as dependências de áudio:\n")
                f.write("pip install pydub\n")

            print(f"📄 Roteiro salvo em: {output_path}")
            return output_path

        except Exception as e:
            print(f"❌ Erro ao criar fallback: {e}")
            return ""

    def create_professional_mix(self, segments: List[PodcastSegment], config: PodcastConfig) -> str:
        """Cria mixagem profissional do podcast"""

        if not self.audio_available:
            print("⚠️  Mixagem profissional requer audio_utils")
            return self.assemble_podcast(segments, config)

        try:
            output_path = os.path.join(self.temp_dir, f"podcast_pro_{config.title.replace(' ', '_')}.mp3")

            audio_files = [s.audio_path for s in segments if s.audio_path and os.path.exists(s.audio_path)]

            if not audio_files:
                return self.assemble_podcast(segments, config)

            return self.mixer.create_professional_mix(
                segments=audio_files,
                output_path=output_path,
                normalize_volume=True
            )

        except Exception as e:
            print(f"❌ Erro na mixagem profissional: {e}")
            return self.assemble_podcast(segments, config)

class PodcastGenerator:
    """Classe principal para geração de podcasts"""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OpenAI API key é obrigatória")

        self.client = openai.OpenAI(api_key=self.api_key)

        # Componentes do sistema
        self.content_analyzer = ContentAnalyzer(self.client)
        self.persona_generator = PersonaGenerator(self.client)
        self.script_generator = UnifiedScriptGenerator(self.client)
        self.audio_generator = AudioGenerator(self.client)
        self.podcast_assembler = PodcastAssembler()

    def generate_podcast(
        self,
        content: str,
        title: str = "Podcast Gerado por IA",
        duration_minutes: int = 2,
        tone: ToneType = ToneType.CASUAL,
        target_audience: str = "Público geral",
        format_style: str = "Conversa informal entre dois apresentadores"
    ) -> str:
        """
        Gera um podcast completo a partir do conteúdo fornecido

        Args:
            content: Conteúdo base para o podcast
            title: Título do podcast
            duration_minutes: Duração em minutos
            tone: Tom da conversa
            target_audience: Público-alvo
            format_style: Estilo do formato

        Returns:
            Caminho para o arquivo de áudio do podcast
        """

        print("🎙️ Iniciando geração de podcast...")
        print("=" * 50)

        # 1. Configuração
        config = PodcastConfig(
            title=title,
            topic=content[:100] + "..." if len(content) > 100 else content,
            duration_minutes=duration_minutes,
            tone=tone,
            target_audience=target_audience,
            format_style=format_style
        )

        print(f"📝 Configuração: {config.title}")

        # 2. Análise de conteúdo
        print("🔍 Analisando conteúdo...")
        content_analysis = self.content_analyzer.analyze_content(content)
        print(f"✅ Tópico identificado: {content_analysis['topic']}")

        # 3. Geração de personas
        print("👥 Gerando personas...")
        persona1, persona2 = self.persona_generator.generate_personas(content_analysis, config)
        print(f"✅ Personas: {persona1.name} ({persona1.role}) e {persona2.name} ({persona2.role})")

        # 4. Geração do roteiro (agente unificado)
        print("📝 Gerando roteiro...")
        segments = self.script_generator.generate_complete_script(content_analysis, persona1, persona2, config)
        print(f"✅ Roteiro gerado com {len(segments)} segmentos")

        # 5. Geração de áudio (parallelizada)
        print("🎵 Gerando áudio...")
        personas_map = {persona1.name: persona1, persona2.name: persona2}

        # Processa áudio em paralelo
        from concurrent.futures import ThreadPoolExecutor, as_completed
        import threading

        def generate_segment_audio(segment_data):
            i, segment = segment_data
            try:
                print(f"  🔄 Iniciando segmento {i+1}/{len(segments)}: {segment.speaker}")
                persona = personas_map.get(segment.speaker, persona1)
                audio_path = self.audio_generator.generate_audio_for_segment(segment, persona)
                print(f"  ✅ Concluído segmento {i+1}/{len(segments)}: {segment.speaker}")
                return i, audio_path, None
            except Exception as e:
                print(f"  ❌ Erro no segmento {i+1}: {e}")
                return i, None, str(e)

        # Executa em paralelo (máximo 3 threads para não sobrecarregar a API)
        max_workers = min(3, len(segments))
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submete todas as tarefas
            futures = {executor.submit(generate_segment_audio, (i, segment)): i
                      for i, segment in enumerate(segments)}

            # Coleta resultados conforme completam
            completed = 0
            errors = []

            for future in as_completed(futures):
                completed += 1
                try:
                    i, audio_path, error = future.result(timeout=120)  # 2 minutos timeout
                    if error:
                        errors.append(f"Segmento {i+1}: {error}")
                    print(f"  📊 Progresso: {completed}/{len(segments)} segmentos processados")
                except Exception as e:
                    errors.append(f"Erro de execução: {e}")

            if errors:
                print(f"  ⚠️ {len(errors)} erro(s) durante geração:")
                for error in errors[:3]:  # Mostra apenas os 3 primeiros
                    print(f"    - {error}")
                if len(errors) > 3:
                    print(f"    ... e mais {len(errors) - 3} erro(s)")

        print("🎵 Geração de áudio concluída!")

        # 6. Montagem final
        print("🎧 Montando podcast final...")
        final_path = self.podcast_assembler.assemble_podcast(segments, config)

        print("=" * 50)
        print(f"✅ Podcast gerado com sucesso!")
        print(f"📁 Arquivo: {final_path}")
        print(f"⏱️ Duração estimada: {duration_minutes} minutos")
        print(f"👥 Apresentadores: {persona1.name} e {persona2.name}")

        return final_path

    def preview_script(self, content: str, **kwargs) -> List[PodcastSegment]:
        """Gera apenas o roteiro para preview"""

        # Configuração simplificada
        config = PodcastConfig(
            title=kwargs.get('title', 'Preview'),
            topic=content[:100],
            duration_minutes=kwargs.get('duration_minutes', 2),
            tone=ToneType(kwargs.get('tone', 'casual')),
            target_audience=kwargs.get('target_audience', 'Público geral'),
            format_style=kwargs.get('format_style', 'Conversa informal')
        )

        # Análise e geração
        content_analysis = self.content_analyzer.analyze_content(content)
        persona1, persona2 = self.persona_generator.generate_personas(content_analysis, config)
        segments = self.script_generator.generate_complete_script(content_analysis, persona1, persona2, config)

        return segments

def main():
    """Função principal para demonstração"""

    # Verifica API key
    if not os.environ.get("OPENAI_API_KEY"):
        print("❌ OPENAI_API_KEY não configurada")
        print("Configure no arquivo .env: OPENAI_API_KEY=sua-chave-aqui")
        return

    # Exemplo de uso
    print("🚀 Gerador de Podcast com IA")
    print("=" * 40)

    # Conteúdo de exemplo
    content = """
    Inteligência Artificial está transformando o mundo dos negócios de forma acelerada.

    Principais impactos:
    - Automação de processos
    - Análise preditiva
    - Atendimento ao cliente
    - Personalização de produtos
    - Otimização de operações

    Empresas que adotam IA reportam:
    - 15% de aumento na produtividade
    - 20% de redução de custos
    - 25% de melhoria na experiência do cliente

    Desafios incluem:
    - Necessidade de capacitação
    - Questões éticas
    - Integração com sistemas existentes
    - Investimento inicial
    """

    try:
        # Cria gerador
        generator = PodcastGenerator()

        # Opção 1: Preview do roteiro
        print("\n1. Gerando preview do roteiro...")
        segments = generator.preview_script(
            content,
            title="IA nos Negócios",
            duration_minutes=2,
            tone="educational"
        )

        print(f"\n📝 ROTEIRO PREVIEW ({len(segments)} segmentos):")
        print("-" * 40)
        for i, segment in enumerate(segments[:5]):  # Mostra apenas os primeiros 5
            print(f"{i+1}. {segment.speaker}: {segment.text[:100]}...")

        # Opção 2: Geração completa
        print("\n2. Quer gerar o podcast completo? (s/n)")
        resposta = input().strip().lower()

        if resposta == 's':
            podcast_path = generator.generate_podcast(
                content=content,
                title="IA nos Negócios - Transformação Digital",
                duration_minutes=1,
                tone=ToneType.EDUCATIONAL,
                target_audience="Profissionais de negócios e tecnologia",
                format_style="Conversa educacional entre especialista e mediador"
            )

            print(f"\n🎧 Podcast salvo em: {podcast_path}")

    except Exception as e:
        print(f"❌ Erro: {e}")
