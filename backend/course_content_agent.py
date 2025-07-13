from __future__ import annotations

import json
import sys
from typing import List

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage
from langgraph.graph import MessageGraph

from .flashcards_agent import generate_flashcards
from .quizzes_agent import generate_quiz


def build_graph() -> MessageGraph:
    """Builds a simple LangGraph that generates course outlines."""
    llm = ChatOpenAI(model="gpt-4")

    def generate(messages: List) -> List:
        return [llm.invoke(messages)]

    builder = MessageGraph()
    builder.add_node("generator", generate)
    builder.set_entry_point("generator")
    builder.set_finish_point("generator")
    return builder.compile()


def generate_course_content(topic: str) -> dict:
    """Generate course content for the given topic and return it as a dict."""
    prompt = (
        "Crie um curso sobre "
        f"{topic} com diversos módulos numerados iniciando em 1 e diversas aulas em cada modulo.\n"
        "Responda SOMENTE em JSON válido, usando aspas duplas, no formato: {\n  \"modules\": [\n"
        "    {\"title\": \"...\", \"lessons\": [\"...\"]}, ...]\n}\n"
        "Não inclua nenhuma explicação ou texto extra."
    )

    graph = build_graph()
    messages = [HumanMessage(content=prompt)]
    result = graph.invoke(messages)
    response = result[-1].content

    try:
        return json.loads(response)
    except json.JSONDecodeError:
        print("Erro ao decodificar JSON. Resposta recebida do modelo:")
        print(response)
        raise


def generate_course_package(
    topic: str,
    course_file: str = "course_content.json",
    flashcards_file: str = "flashcards.json",
    quiz_file: str = "quiz.json",
) -> dict:
    """Generate course content, flashcards and quiz and save them to files."""

    course_content = generate_course_content(topic)
    flashcards = generate_flashcards(course_content)
    content_json = json.dumps(course_content, ensure_ascii=False, indent=2)
    quiz = generate_quiz(content_json)

    package = {
        "course_content": course_content,
        "flashcards": flashcards,
        "quiz": quiz,
    }

    with open(course_file, "w", encoding="utf-8") as f:
        json.dump(course_content, f, ensure_ascii=False, indent=2)

    with open(flashcards_file, "w", encoding="utf-8") as f:
        json.dump(flashcards, f, ensure_ascii=False, indent=2)

    with open(quiz_file, "w", encoding="utf-8") as f:
        json.dump(quiz, f, ensure_ascii=False, indent=2)

    return package


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python course_content_agent.py 'Course topic'")
        raise SystemExit(1)
    topic = sys.argv[1]

    package = generate_course_package(topic)
    print(json.dumps(package, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
