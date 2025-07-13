from __future__ import annotations

import json
import re
import sys
from typing import List

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage
from langgraph.graph.message import MessageGraph


def build_graph() -> MessageGraph:
    """Builds a LangGraph that generates quizzes."""
    llm = ChatOpenAI(model="gpt-4")

    def generate(messages: List) -> List:
        return [llm.invoke(messages)]

    builder = MessageGraph()
    builder.add_node("generator", generate)
    builder.set_entry_point("generator")
    builder.set_finish_point("generator")
    return builder.compile()


def generate_quiz(content_json: str) -> dict:
    """Generate a quiz based on the given course content JSON string."""
    prompt = (
        f"Com base no seguinte conteúdo de curso:\n{content_json}\n"
        "Gere um quiz com perguntas de múltipla escolha para cada módulo. "
        "Responda em JSON no formato: {\n  \"questions\": [\n"
        "    {\"question\": \"...\", \"question_type\": \"multiple-choice\", \"options\": [\"...\", ...], \"correct_answer\": \"...\"}, ...]\n}"
    )

    graph = build_graph()
    messages = [HumanMessage(content=prompt)]
    result = graph.invoke(messages)
    response = result[-1].content

    # Extrai apenas o JSON da resposta
    match = re.search(r"\{[\s\S]*\}", response)
    if match:
        response = match.group(0)

    # Troca aspas simples por duplas
    response = response.replace("'", '"')

    # Escapa aspas duplas internas em valores de propriedades
    def escape_inner_quotes(match):
        value = match.group(0)
        return '"' + value[1:-1].replace('"', r'\"') + '"'

    response = re.sub(r'"([^"]*"(?:[^"]*"[^"]*")*)"', escape_inner_quotes, response)

    try:
        return json.loads(response)
    except json.JSONDecodeError:
        print("Erro ao decodificar JSON do quiz. Resposta recebida do modelo:")
        print(response)
        raise


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python quizzes_agent.py 'Course content text'")
        raise SystemExit(1)
    content = sys.argv[1]

    try:
        quiz = generate_quiz(content)
        print(json.dumps(quiz, indent=2, ensure_ascii=False))
    except json.JSONDecodeError as exc:
        # If the model returns invalid JSON, show the error message
        print(str(exc))


if __name__ == "__main__":
    main()
