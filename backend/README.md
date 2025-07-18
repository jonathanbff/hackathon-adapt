# Course Content Agent

Este diretório contém um script Python que utiliza [LangGraph](https://github.com/langchain-ai/langgraph) para gerar automaticamente um esboço de curso. O agente faz uma chamada a um modelo da OpenAI para criar módulos e aulas a partir de um tema especificado.

## Requisitos

```bash
pip install -r requirements.txt
```

É necessário definir a variável de ambiente `OPENAI_API_KEY` com a sua chave da OpenAI para executar o script.

## Uso

```bash
python course_content_agent.py "Tema do curso"
```

O script exibirá a estrutura do curso em formato JSON e também salvará o resultado em três arquivos:

* `course_content.json` – contém o conteúdo do curso
* `flashcards.json` – flashcards gerados para cada aula
* `quiz.json` – quiz baseado no curso

### Gerar flashcards



## Running
cd frontend
./start-database.sh
cd backend
python course_content_agent.py "Tema do curso"
