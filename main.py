import sys
import asyncio
import importlib
import json
import requests
from rich.pretty import pretty_repr
from rich.syntax import Syntax
from textual.app import App, ComposeResult
from textual.widgets import Input, Static, Header, Footer, Log, RichLog
from textual.containers import Vertical
from textual.reactive import reactive
from textual.message import Message

# Import config utilities
import config_utils

# Dynamically import API_METHODS and CATEGORIES

def make_api_call(cmd, args, api_key):
    """Make an actual API call to constelia.ai using the provided command and arguments."""
    # Base API URL
    base_url = "https://constelia.ai/api.php"
    
    # Prepare parameters
    params = {"key": api_key, "cmd": cmd}
    
    # Add additional arguments as parameters
    post_data = {}
    for arg_name, arg_value in args.items():
        # Check if the argument should be sent as POST data
        if cmd in API_METHODS and arg_name in API_METHODS[cmd].get("parameters", {}):
            if API_METHODS[cmd]["parameters"][arg_name].get("post", False):
                post_data[arg_name] = arg_value
            else:
                params[arg_name] = arg_value
        else:
            # For flags (boolean arguments without values)
            if arg_value is None:
                params[arg_name] = ""
            else:
                params[arg_name] = arg_value
    
    # Make the API call
    if post_data:
        # POST request
        response = requests.post(base_url, params=params, data=post_data)
    else:
        # GET request
        response = requests.get(base_url, params=params)
    
    # Raise an exception for bad status codes
    response.raise_for_status()
    
    # Try to parse JSON response
    try:
        return response.json()
    except json.JSONDecodeError:
        # Return text if not JSON
        return {"response": response.text}
api_mod = importlib.import_module("api_methods")
API_METHODS = api_mod.API_METHODS
CATEGORIES = api_mod.CATEGORIES

# Helper for command/arg parsing
class CommandParser:
    def __init__(self, api_methods, categories):
        self.api_methods = api_methods
        self.categories = categories
        self.commands = list(api_methods.keys())
        self.cat_to_cmds = categories
        self.cmd_to_cat = {cmd: cat for cat, cmds in categories.items() for cmd in cmds}

    def get_commands(self, category=None):
        if category and category in self.cat_to_cmds:
            return self.cat_to_cmds[category]
        return self.commands

    def get_categories(self):
        return list(self.cat_to_cmds.keys())

    def get_command_args(self, cmd):
        return list(self.api_methods.get(cmd, {}).get("parameters", {}).keys())

    def get_command_info(self, cmd):
        return self.api_methods.get(cmd, {})

    def get_category_of(self, cmd):
        return self.cmd_to_cat.get(cmd)

    def complete(self, text):
        # Returns (suggestions, context) for autocomplete
        parts = text.strip().split()
        if not parts or (parts[0] == "help" and len(parts) == 1):
            return ["help"] + self.get_commands() + self.get_categories(), "root"
        if parts[0] == "help":
            if len(parts) == 2:
                # help <category|command>
                opts = self.get_categories() + self.get_commands()
                return [o for o in opts if o.startswith(parts[1])], "help"
            elif len(parts) >= 3:
                # help <command> <arg...>
                cmd = parts[1]
                args = self.get_command_args(cmd)
                already = set(parts[2:])
                return [a for a in args if a not in already], "help_args"
            else:
                return [], "help"
        # Normal command
        if len(parts) == 1:
            return [c for c in self.get_commands() if c.startswith(parts[0])], "cmd"
        cmd = parts[0]
        args = self.get_command_args(cmd)
        already = set()
        for p in parts[1:]:
            if p.startswith("--"):
                already.add(p[2:])
        return [f"--{a}" for a in args if a not in already], "arg"

    def parse(self, text):
        # Returns (cmd, arg_dict) or (None, None)
        parts = text.strip().split()
        if not parts:
            return None, None
        cmd = parts[0]
        if cmd not in self.commands:
            return None, None
        args = {}
        i = 1
        while i < len(parts):
            if parts[i].startswith("--") and i+1 < len(parts):
                args[parts[i][2:]] = parts[i+1]
                i += 2
            else:
                i += 1
        return cmd, args

parser = CommandParser(API_METHODS, CATEGORIES)

class HelpPanel(Static):
    def update_help(self, tokens):
        # Clear the help panel when no tokens are provided
        if not tokens:
            self.update("")
            return
        # For any other help requests, show minimal information
        self.update("")

class CommandInput(Input):
    class Complete(Message):
        def __init__(self, suggestions):
            self.suggestions = suggestions
            super().__init__()

import asyncio
from textual.widget import Widget

class ForumPostsWidget(Static):
    def __init__(self, *args, **kwargs):
        super().__init__("Loading forum posts...", *args, **kwargs)
        self.posts = []
        self.loading = False
        self.scroll_pos = 0
        self.running = False
        self.posts_text = ""
        self.animation_delay = 0.15

    async def fetch_forum_posts(self):
        """Fetch the 5 most recent forum posts from the API"""
        if self.loading:
            return
        
        self.loading = True
        try:
            # Simulate forum post titles
            self.posts = [
                "Welcome to Fantasy CLI - Getting Started Guide",
                "Feature Update: New autocomplete system released", 
                "Community Scripts: Share your automation tools",
                "Bug Fix: Terminal rendering improvements in v2.1",
                "Announcement: Server maintenance scheduled"
            ]
            
            # Create scrolling text with separators
            self.posts_text = " | ".join(self.posts) + " | "
            
        except Exception as e:
            self.posts_text = f"Error: {str(e)}"
        finally:
            self.loading = False

    async def start_updates(self):
        """Start periodic updates and animation of forum posts"""
        await self.fetch_forum_posts()
        await self.start_animation()
        # Refresh posts every 5 minutes
        asyncio.create_task(self.periodic_update())
    
    async def start_animation(self):
        """Start the scrolling animation"""
        if self.running:
            return
        self.running = True
        asyncio.create_task(self.animate())
    
    async def stop_animation(self):
        """Stop the scrolling animation"""
        self.running = False
    
    async def animate(self):
        """Animate the scrolling forum posts"""
        self.scroll_pos = 0
        
        while self.running:
            try:
                # Get terminal width and account for the prefix text
                terminal_width = self.app.size.width if self.app else 80
                prefix = "Latest: "  # Plain text version of the prefix
                available_width = max(10, terminal_width - len(prefix) - 2)  # Reserve space for prefix and margin
                
                if not self.posts_text:
                    await asyncio.sleep(self.animation_delay)
                    continue
                    
                # Create the display line that fits exactly in available width
                text_len = len(self.posts_text)
                
                if text_len <= available_width:
                    # If text fits in available space, just display it
                    line = self.posts_text.ljust(available_width)[:available_width]
                else:
                    # Scroll the text within the available width
                    line = ""
                    for i in range(available_width):
                        char_pos = (i + self.scroll_pos) % text_len
                        line += self.posts_text[char_pos]
                
                # Ensure line is exactly the right length
                line = line[:available_width].ljust(available_width)
                
                self.update(f"[dim]Latest:[/dim] {line}")
                await asyncio.sleep(self.animation_delay)
                self.scroll_pos = (self.scroll_pos + 1) % text_len
                
            except Exception as e:
                self.update(f"[red]Error: {str(e)}[/red]")
                await asyncio.sleep(1)
    
    async def periodic_update(self):
        """Periodically update forum posts"""
        while True:
            await asyncio.sleep(300)  # 5 minutes
            await self.fetch_forum_posts()

class TUIApp(App):
    CSS_PATH = None
    BINDINGS = [
        ("ctrl+c", "quit", "Quit"),
        ("enter", "submit", "Submit")
    ]

    def compose(self) -> ComposeResult:
        yield Header()
        with Vertical():
            yield HelpPanel(id="help_panel")
            yield RichLog(id="output", highlight=True, markup=True)
            yield CommandInput(placeholder="Type a command...", id="cmd_input")
            yield Static(id="suggestion_row")
            yield ForumPostsWidget(id="forum_posts")
        yield Footer()

    async def on_mount(self):
        self.query_one("#help_panel", HelpPanel).update_help([])
        self.suggestions = []
        self.suggestion_index = 0
        self.query_one("#cmd_input", CommandInput).focus()
        forum_posts = self.query_one("#forum_posts", ForumPostsWidget)
        await forum_posts.start_updates()

    async def on_key(self, event):
        focused = self.focused
        if event.key == "tab":
            event.stop()
            event.prevent_default()
            if isinstance(focused, CommandInput):
                # Accept the current suggestion if available
                if getattr(self, 'suggestions', []):
                    await self.action_autocomplete()
                # Manually ensure cursor is at end without refocusing
                focused.cursor_position = len(focused.value)
            # Always do nothing else for Tab (never move focus)
            return
        elif event.key == "enter":
            if isinstance(focused, CommandInput):
                txt = focused.value.strip()
                cmd, args = parser.parse(txt)
                suggestion_row = self.query_one("#suggestion_row", Static)
                if not cmd or (cmd and any(
                    p.startswith('--') and p[2:] not in parser.get_command_args(cmd)
                    for p in txt.split()[1:])):
                    # Malformed: trigger autocomplete instead of submit
                    event.stop()
                    if suggestion_row.visible and getattr(self, 'suggestions', []):
                        await self.action_autocomplete()
                    return
                # else, allow normal submit
            # fall through to default
        elif event.key == "down":

            if isinstance(focused, CommandInput):
                event.stop()
                await self.action_move_suggestion_down()
            else:
                return
        elif event.key == "up":
            if isinstance(focused, CommandInput):
                event.stop()
                await self.action_move_suggestion_up()
            else:
                return
        else:
            return

    async def on_input_changed(self, event: Input.Changed):
        txt = event.value
        suggestion_row = self.query_one("#suggestion_row", Static)
        forum_posts = self.query_one("#forum_posts", ForumPostsWidget)
        if not txt.strip():
            suggestion_row.visible = False
            forum_posts.visible = True
            self.suggestions = []
        else:
            forum_posts.visible = True  # Keep forum posts visible
            # Track last input to decide if we should reset selection
            prev_txt = getattr(self, "_last_input_text", None)
            self._last_input_text = txt

            sugg, ctx = parser.complete(txt)
            self.suggestions = sugg

            # Reset selection only when the user actually changes text (not when we refresh UI)
            if not getattr(self, "_suppress_index_reset", False) and txt != prev_txt:
                self.suggestion_index = 0

            if sugg:
                # Window the suggestions around the current index so the highlight is always visible
                window = 5
                total = len(sugg)
                start = max(0, min(max(0, getattr(self, "suggestion_index", 0)) - 2, max(0, total - window)))
                end = start + window
                best = sugg[start:end]
                row = []
                for i, s in enumerate(best):
                    if (start + i) == getattr(self, "suggestion_index", 0):
                        row.append(f"[reverse]{s}[/reverse]")
                    else:
                        row.append(s)
                # Include a subtle context hint
                hint = f"[dim]{ctx}[/dim]  " if ctx else ""
                suggestion_row.update(hint + "  ".join(row))
                suggestion_row.visible = True
            else:
                suggestion_row.visible = False

            # Always clear the suppression flag after a refresh
            self._suppress_index_reset = False

    async def on_input_submitted(self, event: Input.Submitted):
        txt = event.value.strip()
        output = self.query_one("#output", RichLog)
        if txt.startswith("help"):
            tokens = txt.split()[1:]
            self.query_one("#help_panel", HelpPanel).update_help(tokens)
            return
        cmd, args = parser.parse(txt)
        if not cmd:
            output.write("[red]Unknown command. Type 'help' for a list.[/red]")
            return
        # Get API key
        api_key = config_utils.get_api_key()
        if not api_key:
            output.write("[red]Error: Could not load API key. Check your configuration.[/red]")
            return
        
        # Make actual API call
        try:
            resp = make_api_call(cmd, args, api_key)
            output.write(json.dumps(resp, indent=2))
        except Exception as e:
            output.write(f"[red]Error making API call: {str(e)}[/red]")

    async def action_autocomplete(self):
        suggestion_row = self.query_one("#suggestion_row", Static)
        if self.suggestions:
            selected = self.suggestions[self.suggestion_index] if self.suggestion_index < len(self.suggestions) else self.suggestions[0]
            input_widget = self.query_one("#cmd_input", CommandInput)
            # Replace current word or append
            txt = input_widget.value
            parts = txt.strip().split()
            if not parts:
                input_widget.value = selected + " "
            else:
                # Replace last word
                if txt.endswith(" "):
                    input_widget.value += selected + " "
                else:
                    parts[-1] = selected
                    input_widget.value = " ".join(parts) + " "
            await self.on_input_changed(Input.Changed(input_widget, input_widget.value))
            input_widget.cursor_position = len(input_widget.value)
            suggestion_row.visible = False

    async def action_move_suggestion_down(self):
        suggestion_row = self.query_one("#suggestion_row", Static)
        if self.suggestions:
            self.suggestion_index = (self.suggestion_index + 1) % len(self.suggestions)
            # Re-render without resetting the index
            self._suppress_index_reset = True
            input_w = self.query_one("#cmd_input", CommandInput)
            await self.on_input_changed(Input.Changed(input_w, input_w.value))

    async def action_move_suggestion_up(self):
        suggestion_row = self.query_one("#suggestion_row", Static)
        if self.suggestions:
            self.suggestion_index = (self.suggestion_index - 1) % len(self.suggestions)
            # Re-render without resetting the index
            self._suppress_index_reset = True
            input_w = self.query_one("#cmd_input", CommandInput)
            await self.on_input_changed(Input.Changed(input_w, input_w.value))

if __name__ == "__main__":
    TUIApp().run()
