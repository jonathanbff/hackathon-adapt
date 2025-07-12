from __future__ import annotations

import json
import re
import sys
from typing import List

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage
from langgraph.graph.message import MessageGraph



def build_graph() -> MessageGraph:
    """Builds a LangGraph that generates flashcards."""
    llm = ChatOpenAI(model="gpt-4")

    def generate(messages: List) -> List:
        return [llm.invoke(messages)]

    builder = MessageGraph()
    builder.add_node("generator", generate)
    builder.set_entry_point("generator")
    builder.set_finish_point("generator")
    return builder.compile()


def generate_flashcards(course_content: dict) -> dict:
    """Generate flashcards based on the given course content."""
    content_json = json.dumps(course_content, ensure_ascii=False, indent=2)

    prompt = (
        f"Com base no seguinte conteúdo de curso:\n{content_json}\n"
        "Gere flashcards para cada módulo e aula. "
        "Responda em JSON no formato: {\n  \"flashcards\": [\n"
        "    {\"question\": \"...\", \"answer\": \"...\"}, ...]\n}"
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
        # Remove a aspa inicial e final, escapa as internas
        return '"' + value[1:-1].replace('"', r'\"') + '"'

    # Regex para encontrar valores de string JSON
    response = re.sub(r'"([^"]*"(?:[^"]*"[^"]*")*)"', escape_inner_quotes, response)

    try:
        return json.loads(response)
    except json.JSONDecodeError:
        print("Erro ao decodificar JSON. Resposta recebida do modelo:")
        print(response)
        raise


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python flashcards_agent.py 'Course topic'")
        raise SystemExit(1)
    topic = sys.argv[1]

    from course_content_agent import generate_course_content

    # Generate course content first and then flashcards
    course_content = generate_course_content(topic)
    try:
        cards = generate_flashcards(course_content)
        print(json.dumps(cards, indent=2, ensure_ascii=False))
    except json.JSONDecodeError as exc:
        # If the model returns invalid JSON, show the raw error
        print(str(exc))


if __name__ == "__main__":
    main()
