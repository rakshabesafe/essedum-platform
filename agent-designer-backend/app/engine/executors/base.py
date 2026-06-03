from abc import ABC, abstractmethod
from typing import Any


class BaseExecutor(ABC):
    """Abstract base for all V1 node executors."""

    @abstractmethod
    async def execute(
        self,
        node: dict,
        inputs: dict[str, Any],
        context: dict[str, Any],
    ) -> dict[str, Any]:
        """
        Execute a node.

        Args:
            node:    Full node dict from the flow (id, type, data.config, …).
            inputs:  Resolved input values from upstream nodes.
            context: Execution-wide context (flow_id, session_id, execution_id, input, …).

        Returns:
            dict of output values keyed by output port name.
        """
        ...
