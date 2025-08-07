import sys
import asyncio
import importlib
import json
from rich.pretty import pretty_repr
from rich.syntax import Syntax
from textual.app import App, ComposeResult
from textual.widgets import Input, Static, Header, Footer, Log
from textual.containers import Vertical
from textual.reactive import reactive
from textual.message import Message

# Dynamically import API_METHODS and CATEGORIES
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
        # tokens: list of words after 'help'
        if not tokens:
            # Show all categories
            cats = parser.get_categories()
            self.update("[b]Categories:[/b]\n" + "\n".join(cats))
            return
        if tokens[0] in parser.get_categories():
            # Show all commands in category
            cmds = parser.get_commands(tokens[0])
            out = f"[b]{tokens[0]} Commands:[/b]\n" + "\n".join(cmds)
            self.update(out)
            return
        if tokens[0] in parser.get_commands():
            # Show command info
            info = parser.get_command_info(tokens[0])
            out = f"[b]{tokens[0]}[/b]: {info.get('description','')}\n"
            out += f"[b]Category:[/b] {info.get('category','')}\n"
            params = info.get('parameters',{})
            if params:
                out += "[b]Arguments:[/b]\n"
                for k,v in params.items():
                    out += f"  --{k} ({v['type']}) {'[required]' if v.get('required') else '[optional]'}\n"
            out += f"[b]Example:[/b] {info.get('example','')}\n"
            self.update(out)
            return
        # help <command> <arg> ...
        self.update("[i]No further help available.[/i]")

class CommandInput(Input):
    class Complete(Message):
        def __init__(self, suggestions):
            self.suggestions = suggestions
            super().__init__()

import asyncio
from textual.widget import Widget

class BannerWidget(Static):
    MOON = "🌙"
    NUM_MOONS = 3
    DELAY = 0.1
    def __init__(self, *args, **kwargs):
        super().__init__("", *args, **kwargs)
        self.banner_offset = 0
        self.running = False
        self.visible = False

    async def start_animation(self):
        if self.running:
            return
        self.running = True
        self._banner_task = asyncio.create_task(self.animate())

    async def stop_animation(self):
        self.running = False
        if hasattr(self, '_banner_task') and self._banner_task:
            self._banner_task.cancel()
            self._banner_task = None

    async def animate(self):
        prev_width = None
        self.banner_offset = 0
        while self.running:
            width = self.app.size.width if self.app else 80
            if prev_width is not None and width != prev_width:
                self.banner_offset = 0  # Reset animation on resize
            prev_width = width
            spacing = width // (self.NUM_MOONS + 1)
            total_travel = width + (self.NUM_MOONS - 1) * spacing
            line = [" "] * width
            for i in range(self.NUM_MOONS):
                pos = width - 1 + i * spacing - self.banner_offset
                if 0 <= pos < width:
                    line[pos] = self.MOON
            self.update("".join(line))
            self.banner_offset += 1
            if self.banner_offset > total_travel:
                self.banner_offset = 0
            await asyncio.sleep(self.DELAY)

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
            yield Log(id="output", highlight=True)
            yield CommandInput(placeholder="Type a command...", id="cmd_input")
            yield Static(id="suggestion_row")
            yield BannerWidget(id="banner")
        yield Footer()

    async def on_mount(self):
        self.query_one("#help_panel", HelpPanel).update_help([])
        self.suggestions = []
        self.suggestion_index = 0
        self.query_one("#cmd_input", CommandInput).focus()

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
        banner = self.query_one("#banner", BannerWidget)
        if not txt.strip():
            suggestion_row.visible = False
            banner.visible = True
            await banner.start_animation()
            self.suggestions = []
        else:
            banner.visible = False
            await banner.stop_animation()
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
        output = self.query_one("#output", Log)
        if txt.startswith("help"):
            tokens = txt.split()[1:]
            self.query_one("#help_panel", HelpPanel).update_help(tokens)
            return
        cmd, args = parser.parse(txt)
        if not cmd:
            output.write("[red]Unknown command. Type 'help' for a list.[/red]")
            return
        # Simulate API call (replace with real logic as needed)
        resp = {"command": cmd, "args": args, "result": f"Simulated response for {cmd}"}
        pretty = pretty_repr(resp)
        # Log.write expects a string, not a Syntax object
        output.write(json.dumps(resp, indent=2))

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
