from __future__ import annotations

import json
import sys
from typing import List

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage
from langgraph.graph import MessageGraph


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


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python course_content_agent.py 'Course topic'")
        raise SystemExit(1)
    topic = sys.argv[1]

    prompt = (
        "Crie um curso sobre "
        f"{topic} com diversos módulos numerados iniciando em 1 e diversas aulas em cada modulo.\n"
        "Responda em JSON no formato: {\n  'modules': [\n"
        "    {'title': '...', 'lessons': ['...']}, ...]\n}"
    )

    graph = build_graph()
    messages = [HumanMessage(content=prompt)]
    result = graph.invoke(messages)
    response = result[-1].content
    try:
        outline = json.loads(response)
        print(json.dumps(outline, indent=2, ensure_ascii=False))
    except json.JSONDecodeError:
        print(response)


if __name__ == "__main__":
    main()
