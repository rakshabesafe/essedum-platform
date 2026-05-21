from collections import defaultdict, deque
from typing import Any


def build_adjacency(nodes: list[dict], edges: list[dict]) -> dict[str, list[str]]:
    """Returns node_id → list of downstream node_ids."""
    adj: dict[str, list[str]] = defaultdict(list)
    for edge in edges:
        adj[edge["source"]].append(edge["target"])
    return adj


def topological_sort(nodes: list[dict], edges: list[dict]) -> list[str]:
    """Kahn's algorithm. Raises ValueError on cycle detection."""
    node_ids = {n["id"] for n in nodes}
    in_degree: dict[str, int] = {nid: 0 for nid in node_ids}

    for edge in edges:
        if edge["target"] in in_degree:
            in_degree[edge["target"]] += 1

    queue: deque[str] = deque(
        nid for nid, deg in in_degree.items() if deg == 0
    )
    order: list[str] = []

    # Build reverse adjacency for in-degree updates
    adj = build_adjacency(nodes, edges)

    while queue:
        nid = queue.popleft()
        order.append(nid)
        for neighbor in adj.get(nid, []):
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    if len(order) != len(node_ids):
        raise ValueError("Flow graph contains a cycle — cannot execute.")

    return order


def get_node_by_id(nodes: list[dict], node_id: str) -> dict:
    for n in nodes:
        if n["id"] == node_id:
            return n
    raise KeyError(f"Node '{node_id}' not found in flow.")


def resolve_inputs(
    node_id: str, edges: list[dict], context: dict[str, Any]
) -> dict[str, Any]:
    """Collect outputs from upstream nodes via edges into this node's input dict."""
    inputs: dict[str, Any] = {}
    for edge in edges:
        if edge["target"] != node_id:
            continue
        source_output = context.get(edge["source"], {})
        source_handle = edge.get("sourceHandle") or "output"
        target_handle = edge.get("targetHandle") or "input"

        # Resolve source handle: try exact key first, then first value
        value = source_output.get(source_handle)
        if value is None and source_output:
            value = next(iter(source_output.values()))

        inputs[target_handle] = value
    return inputs


def find_nodes_by_type(nodes: list[dict], node_type: str) -> list[dict]:
    return [n for n in nodes if n.get("type") == node_type]
