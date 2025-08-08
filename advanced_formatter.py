import json
from typing import Any, Dict, List, Union
from rich.tree import Tree
from rich.panel import Panel
from rich import print as rprint


def create_collapsible_tree(data: Any, tree: Tree = None, key: str = "root", is_last: bool = True) -> Tree:
    """Create a collapsible tree structure for complex JSON data."""
    if tree is None:
        tree = Tree(f"[bold blue]{key}[/bold blue]", guide_style="bold bright_blue")
    
    if isinstance(data, dict):
        for i, (k, v) in enumerate(data.items()):
            is_last_item = i == len(data) - 1
            if isinstance(v, (dict, list)) and v:
                # Create a branch for complex nested structures
                branch = tree.add(f"[bold yellow]{k}[/bold yellow]", guide_style="bold yellow")
                create_collapsible_tree(v, branch, k, is_last_item)
            else:
                # Display simple key-value pairs directly
                formatted_value = format_simple_value(v)
                tree.add(f"[green]{k}[/green]: {formatted_value}")
    elif isinstance(data, list):
        for i, item in enumerate(data):
            is_last_item = i == len(data) - 1
            if isinstance(item, (dict, list)) and item:
                # Create a branch for complex list items
                branch = tree.add(f"[bold magenta][{i}][/bold magenta]", guide_style="bold magenta")
                create_collapsible_tree(item, branch, f"[{i}]", is_last_item)
            else:
                # Display simple list items directly
                formatted_value = format_simple_value(item)
                tree.add(f"[magenta][{i}][/magenta] {formatted_value}")
    else:
        # Handle simple values
        formatted_value = format_simple_value(data)
        tree.add(formatted_value)
    
    return tree

def format_simple_value(value: Any) -> str:
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

def format_response_advanced(data: Any) -> str:
    """Format API response with advanced collapsible tree display."""
    try:
        tree = create_collapsible_tree(data)
        # Convert tree to string representation
        from io import StringIO
        import sys
        
        # Capture rich output
        old_stdout = sys.stdout
        sys.stdout = mystdout = StringIO()
        rprint(tree)
        sys.stdout = old_stdout
        
        return mystdout.getvalue()
    except Exception as e:
        # Fallback to simple formatting if tree creation fails
        return format_simple_response(data)

def format_simple_response(data: Any) -> str:
    """Simple fallback formatting for responses."""
    if isinstance(data, (dict, list)):
        return json.dumps(data, indent=2)
    else:
        return str(data)
