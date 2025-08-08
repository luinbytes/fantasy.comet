from textual.widgets import Tree
from textual.widgets.tree import TreeNode
from typing import Any, Dict, List, Union
import json


class CollapsibleJSON(Tree):
    """A collapsible JSON viewer widget."""
    
    def __init__(self, data: Any, **kwargs):
        super().__init__("root", **kwargs)
        self.data = data
        self.root.expand()
        self._build_tree(self.data, self.root)
    
    def _build_tree(self, data: Any, node: TreeNode, key: str = "root"):
        """Recursively build the tree from JSON data."""
        if isinstance(data, dict):
            for k, v in data.items():
                if isinstance(v, (dict, list)) and v:
                    # Create a branch for complex nested structures
                    branch = node.add(k, expand=False)
                    self._build_tree(v, branch, k)
                else:
                    # Display simple key-value pairs directly
                    formatted_value = self._format_simple_value(v)
                    node.add(f"{k}: {formatted_value}")
        elif isinstance(data, list):
            for i, item in enumerate(data):
                if isinstance(item, (dict, list)) and item:
                    # Create a branch for complex list items
                    branch = node.add(f"[{i}]", expand=False)
                    self._build_tree(item, branch, f"[{i}]")
                else:
                    # Display simple list items directly
                    formatted_value = self._format_simple_value(item)
                    node.add(f"[{i}] {formatted_value}")
        else:
            # Handle simple values
            formatted_value = self._format_simple_value(data)
            node.add(formatted_value)
    
    def _format_simple_value(self, value: Any) -> str:
        """Format simple values with appropriate coloring."""
        if value is None:
            return "[italic bright_black]null[/italic bright_black]"
        elif isinstance(value, bool):
            return f"[bold yellow]{str(value).lower()}[/bold yellow]"
        elif isinstance(value, (int, float)):
            return f"[bold cyan]{value}[/bold cyan]"
        elif isinstance(value, str):
            # Check if it looks like an error message
            if "error" in value.lower() or "invalid" in value.lower():
                return f"[red]{json.dumps(value)}[/red]"
            # Check if it's a long string that should be truncated
            if len(value) > 100:
                return f"[green]{json.dumps(value[:100] + '...')}[/green]"
            return f"[green]{json.dumps(value)}[/green]"
        else:
            return f"[white]{json.dumps(value)}[/white]"
