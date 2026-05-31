# Skill Sheet: QUERY_RAG

```yaml
id: S-BRAH-01
version: 1.0.0
category: Orchestrator
name: QUERY_RAG
status: ACTIVE
description: "Search Brahma's internal RAG knowledge base for system documentation."
paramSpec: '{ "query": "string" }'
```

---

## 1. Activation & Execution Triggers

* **Keyword Triggers**: search, rag, knowledge, query, document, detail
* **Context Conditions**: User queries corresponding operation in natural language.

---

## 2. Input / Output Schema Specification

### Input Parameters
| Parameter | Data Type | Required | Description |
| :--- | :---: | :---: | :--- |
| params | `object` | **YES** | Conforming to YAML paramSpec contract. |

---

## 3. High-Density Rules & Directives

- Hydrate using full 8-stage Advanced RAG pipeline.
- Enforce MMR deduplication and high relevance constraints.

---

## 4. Execution Patterns (Examples)

Standard payload invocation:
```json
{
  "action": "QUERY_RAG",
  "params": { "query": "string" }
}
```
