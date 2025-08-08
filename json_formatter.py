import json
from typing import Any, Dict, List, Union


def format_json_response(data: Any, indent: int = 0) -> str:
    """Format JSON response for nice TUI display with proper indentation and coloring."""
    if isinstance(data, dict):
        return format_dict(data, indent)
    elif isinstance(data, list):
        return format_list(data, indent)
    else:
        return format_value(data, indent)


def format_dict(data: Dict[str, Any], indent: int = 0) -> str:
    """Format dictionary for TUI display."""
    if not data:
        return "{}"
    
    # Special handling for error responses
    if 'error' in data or 'message' in data:
        return format_error_response(data, indent)
    
    # Special handling for simple key-value pairs
    if len(data) <= 5 and all(not isinstance(v, (dict, list)) for v in data.values()):
        pairs = []
        for key, value in data.items():
            formatted_value = format_value(value)
            pairs.append(f"[bold blue]{key}[/bold blue]: {formatted_value}")
        return "  " * indent + ", ".join(pairs)
    
    # Default dictionary formatting
    lines = ["{"]
    indent_str = "  " * (indent + 1)
    
    for i, (key, value) in enumerate(data.items()):
        formatted_value = format_json_response(value, indent + 1)
        lines.append(f"{indent_str}[bold blue]{key}[/bold blue]: {formatted_value}")
    
    lines.append("  " * indent + "}")
    return "\n".join(lines)


def format_list(data: List[Any], indent: int = 0) -> str:
    """Format list for TUI display."""
    if not data:
        return "[]"
    
    # Special handling for simple arrays of strings (like achievements)
    if all(isinstance(item, str) for item in data) and len(data) > 3:
        # Display as a bulleted list for better readability
        lines = [f"[bold underline]Items ({len(data)} total):[/bold underline]"]
        indent_str = "  " * indent
        for i, item in enumerate(data):
            lines.append(f"{indent_str}[yellow]•[/yellow] [green]{item}[/green]")
        return "\n".join(lines)
    
    # Special handling for small arrays of simple values
    if len(data) <= 5 and all(not isinstance(item, (dict, list)) for item in data):
        formatted_items = [format_value(item) for item in data]
        return "[" + ", ".join(formatted_items) + "]"
    
    # Default list formatting
    lines = ["["]
    indent_str = "  " * (indent + 1)
    
    for i, item in enumerate(data):
        formatted_item = format_json_response(item, indent + 1)
        lines.append(f"{indent_str}{formatted_item}")
    
    lines.append("  " * indent + "]")
    return "\n".join(lines)


def format_value(value: Any, indent: int = 0) -> str:
    """Format a single value for TUI display with appropriate coloring."""
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
        # Check if it's a long string that should be wrapped
        if len(value) > 80:
            wrapped = '\n'.join([value[i:i+80] for i in range(0, len(value), 80)])
            return f"[green]{wrapped}[/green]"
        return f"[green]{json.dumps(value)}[/green]"
    else:
        return f"[white]{json.dumps(value)}[/white]"
