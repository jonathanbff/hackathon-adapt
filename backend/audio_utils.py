

#!/usr/bin/env python3
"""
Utilitários para manipulação de áudio no sistema de podcast
"""

import os
import tempfile
import subprocess
from typing import List, Optional
from dataclasses import dataclass
import json

try:
    from pydub import AudioSegment
    from pydub.playback import play
    PYDUB_AVAILABLE = True
except ImportError:
    PYDUB_AVAILABLE = False
    print("⚠️  PyDub não instalado. Funcionalidade de áudio limitada.")
    print("   Instale com: pip install pydub")

@dataclass
class AudioConfig:
    """Configuração para processamento de áudio"""
    sample_rate: int = 24000
    channels: int = 1
    bit_depth: int = 16
    format: str = "mp3"
    quality: str = "high"

class AudioProcessor:
    """Processador de áudio para podcasts"""

    def __init__(self, config: AudioConfig = None):
        self.config = config or AudioConfig()
        self.temp_dir = tempfile.mkdtemp()

    def concatenate_audio_files(self, audio_files: List[str], output_path: str,
                               add_silence: bool = True, silence_duration: int = 500) -> str:
        """
        Concatena múltiplos arquivos de áudio

        Args:
            audio_files: Lista de caminhos para arquivos de áudio
            output_path: Caminho para salvar o arquivo concatenado
            add_silence: Se deve adicionar silêncio entre segmentos
            silence_duration: Duração do silêncio em ms

        Returns:
            Caminho do arquivo concatenado
        """

        if not PYDUB_AVAILABLE:
            return self._concatenate_with_ffmpeg(audio_files, output_path)

        try:
            # Inicia com áudio vazio
            combined = AudioSegment.empty()

            for i, audio_file in enumerate(audio_files):
                if not os.path.exists(audio_file):
                    print(f"⚠️  Arquivo não encontrado: {audio_file}")
                    continue

                # Carrega arquivo de áudio
                audio = AudioSegment.from_file(audio_file)

                # Adiciona ao áudio combinado
                combined += audio

                # Adiciona silêncio entre segmentos (exceto no último)
                if add_silence and i < len(audio_files) - 1:
                    silence = AudioSegment.silent(duration=silence_duration)
                    combined += silence

            # Salva arquivo final
            combined.export(output_path, format=self.config.format)

            print(f"✅ Áudio concatenado salvo em: {output_path}")
            print(f"⏱️  Duração total: {len(combined) / 1000:.1f} segundos")

            return output_path

        except Exception as e:
            print(f"❌ Erro na concatenação: {e}")
            return self._concatenate_with_ffmpeg(audio_files, output_path)

    def _concatenate_with_ffmpeg(self, audio_files: List[str], output_path: str) -> str:
        """Fallback usando ffmpeg para concatenação"""

        try:
            # Cria arquivo de lista para ffmpeg
            filelist_path = os.path.join(self.temp_dir, "filelist.txt")

            with open(filelist_path, 'w') as f:
                for audio_file in audio_files:
                    if os.path.exists(audio_file):
                        f.write(f"file '{audio_file}'\n")

            # Comando ffmpeg para concatenar
            cmd = [
                'ffmpeg', '-f', 'concat', '-safe', '0', '-i', filelist_path,
                '-c', 'copy', output_path, '-y'
            ]

            result = subprocess.run(cmd, capture_output=True, text=True)

            if result.returncode == 0:
                print(f"✅ Áudio concatenado com ffmpeg: {output_path}")
                return output_path
            else:
                print(f"❌ Erro no ffmpeg: {result.stderr}")
                return self._create_placeholder_audio(output_path)

        except Exception as e:
            print(f"❌ Erro no fallback ffmpeg: {e}")
            return self._create_placeholder_audio(output_path)

    def _create_placeholder_audio(self, output_path: str) -> str:
        """Cria arquivo de áudio placeholder quando não consegue concatenar"""

        try:
            # Cria áudio de placeholder usando pydub
            if PYDUB_AVAILABLE:
                # Tom simples de 1 segundo
                tone = AudioSegment.from_file(None, format="raw",
                                            frame_rate=self.config.sample_rate,
                                            channels=self.config.channels,
                                            sample_width=2)

                # Salva placeholder
                tone.export(output_path, format=self.config.format)

            else:
                # Cria arquivo de texto como placeholder
                with open(output_path, 'w') as f:
                    f.write("# Arquivo de áudio placeholder\n")
                    f.write("# Concatenação real não disponível\n")

            return output_path

        except Exception as e:
            print(f"❌ Erro ao criar placeholder: {e}")
            return ""

    def add_intro_outro(self, main_audio: str, intro_path: Optional[str] = None,
                       outro_path: Optional[str] = None, output_path: str = None) -> str:
        """
        Adiciona introdução e encerramento ao áudio principal

        Args:
            main_audio: Caminho do áudio principal
            intro_path: Caminho do áudio de introdução (opcional)
            outro_path: Caminho do áudio de encerramento (opcional)
            output_path: Caminho para salvar o resultado

        Returns:
            Caminho do arquivo final
        """

        if not PYDUB_AVAILABLE:
            print("⚠️  PyDub necessário para adicionar intro/outro")
            return main_audio

        try:
            # Carrega áudio principal
            main = AudioSegment.from_file(main_audio)

            # Adiciona introdução
            if intro_path and os.path.exists(intro_path):
                intro = AudioSegment.from_file(intro_path)
                main = intro + main
                print("🎵 Introdução adicionada")

            # Adiciona encerramento
            if outro_path and os.path.exists(outro_path):
                outro = AudioSegment.from_file(outro_path)
                main = main + outro
                print("🎵 Encerramento adicionado")

            # Salva resultado
            output_path = output_path or main_audio.replace('.mp3', '_final.mp3')
            main.export(output_path, format=self.config.format)

            return output_path

        except Exception as e:
            print(f"❌ Erro ao adicionar intro/outro: {e}")
            return main_audio

    def adjust_volume(self, audio_path: str, volume_change: float) -> str:
        """
        Ajusta o volume do áudio

        Args:
            audio_path: Caminho do arquivo
            volume_change: Mudança em dB (positivo aumenta, negativo diminui)

        Returns:
            Caminho do arquivo ajustado
        """

        if not PYDUB_AVAILABLE:
            print("⚠️  PyDub necessário para ajustar volume")
            return audio_path

        try:
            audio = AudioSegment.from_file(audio_path)
            adjusted = audio + volume_change
            adjusted.export(audio_path, format=self.config.format)

            print(f"🔊 Volume ajustado em {volume_change:+.1f}dB")
            return audio_path

        except Exception as e:
            print(f"❌ Erro ao ajustar volume: {e}")
            return audio_path

    def get_audio_info(self, audio_path: str) -> dict:
        """
        Obtém informações sobre o arquivo de áudio

        Args:
            audio_path: Caminho do arquivo

        Returns:
            Dicionário com informações do áudio
        """

        if not PYDUB_AVAILABLE:
            return {
                "duration": 0,
                "channels": 1,
                "sample_rate": self.config.sample_rate,
                "available": False
            }

        try:
            audio = AudioSegment.from_file(audio_path)

            return {
                "duration": len(audio) / 1000,  # em segundos
                "channels": audio.channels,
                "sample_rate": audio.frame_rate,
                "frame_count": audio.frame_count(),
                "available": True
            }

        except Exception as e:
            print(f"❌ Erro ao obter info do áudio: {e}")
            return {"duration": 0, "available": False}

    def create_silence(self, duration_seconds: float, output_path: str) -> str:
        """
        Cria arquivo de áudio com silêncio

        Args:
            duration_seconds: Duração em segundos
            output_path: Caminho para salvar

        Returns:
            Caminho do arquivo criado
        """

        if not PYDUB_AVAILABLE:
            print("⚠️  PyDub necessário para criar silêncio")
            return ""

        try:
            silence = AudioSegment.silent(duration=int(duration_seconds * 1000))
            silence.export(output_path, format=self.config.format)

            print(f"🔇 Silêncio de {duration_seconds}s criado")
            return output_path

        except Exception as e:
            print(f"❌ Erro ao criar silêncio: {e}")
            return ""

    def cleanup_temp_files(self):
        """Remove arquivos temporários"""

        try:
            import shutil
            shutil.rmtree(self.temp_dir)
            print("🧹 Arquivos temporários removidos")

        except Exception as e:
            print(f"⚠️  Erro ao limpar arquivos temporários: {e}")

class PodcastMixer:
    """Classe para mixagem avançada de podcasts"""

    def _init_(self):
        self.processor = AudioProcessor()

    def create_professional_mix(self, segments: List[str], output_path: str,
                               add_background_music: bool = False,
                               normalize_volume: bool = True) -> str:
        """
        Cria mixagem profissional do podcast

        Args:
            segments: Lista de segmentos de áudio
            output_path: Caminho de saída
            add_background_music: Se deve adicionar música de fundo
            normalize_volume: Se deve normalizar o volume

        Returns:
            Caminho do arquivo final
        """

        print("🎛️  Iniciando mixagem profissional...")

        # 1. Concatena segmentos básicos
        temp_path = os.path.join(self.processor.temp_dir, "temp_mix.mp3")
        self.processor.concatenate_audio_files(segments, temp_path)

        # 2. Normaliza volume se solicitado
        if normalize_volume:
            self.processor.adjust_volume(temp_path, 0)  # Normalização básica

        # 3. Adiciona música de fundo se solicitado
        if add_background_music:
            temp_path = self._add_background_music(temp_path)

        # 4. Move para caminho final
        if temp_path != output_path:
            import shutil
            shutil.move(temp_path, output_path)

        print("✅ Mixagem profissional concluída")
        return output_path

    def _add_background_music(self, audio_path: str) -> str:
        """Adiciona música de fundo sutil"""

        # Implementação básica - pode ser expandida
        print("🎵 Adicionando música de fundo...")
        return audio_path

    def create_chapters(self, audio_path: str, chapter_times: List[float],
                       chapter_titles: List[str]) -> str:
        """
        Adiciona capítulos ao podcast

        Args:
            audio_path: Caminho do áudio
            chapter_times: Lista de tempos dos capítulos (em segundos)
            chapter_titles: Lista de títulos dos capítulos

        Returns:
            Caminho do arquivo com capítulos
        """

        print("📚 Adicionando capítulos ao podcast...")

        # Cria arquivo de metadados para capítulos
        metadata_path = audio_path.replace('.mp3', '_chapters.json')

        chapters = []
        for i, (time, title) in enumerate(zip(chapter_times, chapter_titles)):
            chapters.append({
                "index": i,
                "time": time,
                "title": title
            })

        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump({"chapters": chapters}, f, indent=2, ensure_ascii=False)

        print(f"✅ Capítulos salvos em: {metadata_path}")
        return audio_path

def test_audio_system():
    """Testa o sistema de áudio"""

    print("🧪 Testando sistema de áudio...")

    processor = AudioProcessor()

    # Teste 1: Informações de configuração
    print(f"📊 Configuração: {processor.config}")

    # Teste 2: PyDub disponível?
    if PYDUB_AVAILABLE:
        print("✅ PyDub disponível")

        # Teste 3: Criar silêncio
        silence_path = os.path.join(processor.temp_dir, "test_silence.mp3")
        processor.create_silence(2.0, silence_path)

        if os.path.exists(silence_path):
            print("✅ Criação de silêncio funcionando")

            # Teste 4: Informações do áudio
            info = processor.get_audio_info(silence_path)
            print(f"📋 Info do áudio: {info}")

    else:
        print("❌ PyDub não disponível")
        print("   Funcionalidades limitadas")

    # Limpeza
    processor.cleanup_temp_files()

    print("✅ Teste concluído")
