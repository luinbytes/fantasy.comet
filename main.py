import requests
import os
import json
from textual.app import App, ComposeResult
from textual.widgets import Header, Footer, Input, RichLog, ListView, ListItem, Label
from textual.containers import Container
from textual.reactive import reactive

from textual.widgets import Tree
from textual.widgets.tree import TreeNode
from rich.text import Text

class JsonTree(Tree):
    """A Tree widget that can display JSON data."""

    def __init__(self, name: str, data: dict | list, id: str | None = None, show_root: bool = True):
        super().__init__(name, id=id)
        self.data = data
        self.show_root = show_root
        super().__init__(name, id=id)
        self.data = data

    def on_mount(self) -> None:
        self.add_json_data(self.root, self.data)

    def add_json_data(self, node: TreeNode, data: dict | list | str | int | float | bool | None) -> None:
        """Recursively adds JSON data to the tree."""
        if isinstance(data, dict):
            for key, value in data.items():
                if isinstance(value, (dict, list)):
                    new_node = node.add(Text(key, style="bold"))
                    self.add_json_data(new_node, value)
                else:
                    node.add_leaf(Text(f"{key}: {value}", style="green"))
        elif isinstance(data, list):
            for index, value in enumerate(data):
                if isinstance(value, (dict, list)):
                    new_node = node.add(Text(f"[{index}]", style="bold"))
                    self.add_json_data(new_node, value)
                else:
                    node.add_leaf(Text(f"[{index}]: {value}", style="green"))
        else:
            node.add_leaf(Text(str(data), style="green"))


# Base URL for the Constelia API
BASE_URL = "https://constelia.ai/api.php"

# Configuration file path
CONFIG_DIR = os.path.join(os.path.expanduser("~"), ".comet")
CONFIG_FILE = os.path.join(CONFIG_DIR, "config.json")

# Global variable for the API key (will be managed by the App)
API_KEY = None

# Categories for API methods
CATEGORIES = {
    "Handshake": ["getHandshake", "authorizeHandshake", "terminateHandshake"],
    "Achievements": ["getAchievements", "redeemAchievements"],
    "Builds": ["createBuild", "deleteBuild", "getBuilds"],
    "Uploads": ["upload", "setUpload"],
    "Settings": ["setLanguage", "setKeys", "setProtection", "resetConfiguration"],
    "AI": ["heyConstelia", "teachConstelia"],
    "FC2T Projects": ["getFC2TProjects", "getFC2TProject", "toggleProjectStatus", "setMemberProjects"],
    "Member Management": ["deleteMinecraftWhitelist", "addMinecraftWhitelist", "getMemberAsBuddy", "hideSteamAccount", "showSteamAccount", "getMember"],
    "Perks": ["respecPerks", "listPerks", "buyPerk", "changeVenus", "rollLoot", "getDivinityChart"],
    "Scripts": ["toggleScriptStatus", "getScript", "getAllScripts", "updateScript", "setMemberScripts"],
    "Software": ["getSoftware", "getAllSoftware"],
    "Forum": ["getForumPosts", "sendCommand", "getConfiguration", "setConfiguration"]
}

# Placeholder for API methods. This will be populated dynamically.
# Each method will have its name, description, parameters, and category.
API_METHODS = {
    "getHandshake": {
        "description": "Retrieves a license key using a temporary unique code.",
        "parameters": {"token": {"type": "string", "required": True}},
        "example": "getHandshake --token UNIQUE_CODE_FROM_AUTHORIZE",
        "category": "Handshake"
    },
    "authorizeHandshake": {
        "description": "Creates a temporary unique code for your license key on the server.",
        "parameters": {},
        "example": "authorizeHandshake",
        "category": "Handshake"
    },
    "terminateHandshake": {
        "description": "Forcefully terminates your handshake.",
        "parameters": {"token": {"type": "string", "required": True}},
        "example": "terminateHandshake --token UNIQUE_CODE_FROM_AUTHORIZE",
        "category": "Handshake"
    },
    "getAchievements": {
        "description": "Lists all available achievements.",
        "parameters": {},
        "example": "getAchievements",
        "category": "Achievements"
    },
    "redeemAchievements": {
        "description": "Redeems achievement data. Requires POST data.",
        "parameters": {"value": {"type": "string", "required": True, "post": True}},
        "example": "redeemAchievements --value \"<achievements.dat content>\"",
        "category": "Achievements"
    },
    "createBuild": {
        "description": "Creates a new build or updates your current build.",
        "parameters": {
            "tag": {"type": "string", "required": False},
            "private": {"type": "string", "required": False}
        },
        "example": "createBuild --tag mybuild --private typedef",
        "category": "Builds"
    },
    "deleteBuild": {
        "description": "Wipes your current build.",
        "parameters": {"tag": {"type": "string", "required": False}},
        "example": "deleteBuild --tag mybuild",
        "category": "Builds"
    },
    "upload": {
        "description": "Uploads a file to i.constelia.ai.",
        "parameters": {
            "expire": {"type": "int", "required": False},
            "no_scramble": {"type": "bool", "required": False}
        },
        "example": "upload --file /path/to/your/file.txt --expire 60",
        "category": "Uploads"
    },
    "setUpload": {
        "description": "Changes the URL of an i.constelia.ai upload.",
        "parameters": {
            "old_url": {"type": "string", "required": True},
            "new_url": {"type": "string", "required": True}
        },
        "example": "setUpload --old_url https://i.constelia.ai/old --new_url https://i.constelia.ai/new",
        "category": "Uploads"
    },
    "setLanguage": {
        "description": "Sets your language.",
        "parameters": {"lang": {"type": "string", "required": False}},
        "example": "setLanguage --lang en",
        "category": "Settings"
    },
    "heyConstelia": {
        "description": "Communicates with Constelia's trained AI.",
        "parameters": {"message": {"type": "string", "required": True}},
        "example": "heyConstelia --message \"Hello Constelia\"",
        "category": "AI"
    },
    "teachConstelia": {
        "description": "Teaches Constelia's trained AI custom information. Requires POST data.",
        "parameters": {
            "data": {"type": "string", "required": True, "post": True},
            "info": {"type": "bool", "required": False},
            "wipe": {"type": "bool", "required": False}
        },
        "example": "teachConstelia --data \"I love green apples\"",
        "category": "AI"
    },
    "getFC2TProjects": {
        "description": "Gets all FC2T projects.",
        "parameters": {},
        "example": "getFC2TProjects",
        "category": "FC2T Projects"
    },
    "getFC2TProject": {
        "description": "Gets an FC2T project by its ID.",
        "parameters": {"id": {"type": "int", "required": True}},
        "example": "getFC2TProject --id 1",
        "category": "FC2T Projects"
    },
    "toggleProjectStatus": {
        "description": "Enables/Disables an FC2T project.",
        "parameters": {"id": {"type": "int", "required": True}},
        "example": "toggleProjectStatus --id 1",
        "category": "FC2T Projects"
    },
    "setMemberProjects": {
        "description": "Enables/Disables multiple FC2T projects.",
        "parameters": {"projects": {"type": "list", "required": True}},
        "example": "setMemberProjects --projects [1,2,3]",
        "category": "FC2T Projects"
    },
    "sendCommand": {
        "description": "Sends commands to the Member's Panel and gets the result back.",
        "parameters": {"command": {"type": "string", "required": True}},
        "example": "sendCommand --command session",
        "category": "Forum"
    },
    "getBuilds": {
        "description": "Lists all available builds.",
        "parameters": {},
        "example": "getBuilds",
        "category": "Builds"
    },
    "deleteMinecraftWhitelist": {
        "description": "Removes a member's entry from the Minecraft whitelist.",
        "parameters": {"owner": {"type": "string", "required": True}},
        "example": "deleteMinecraftWhitelist --owner typedef",
        "category": "Member Management"
    },
    "respecPerks": {
        "description": "Removes all purchased perks at a cost of 3000 XP.",
        "parameters": {},
        "example": "respecPerks",
        "category": "Perks"
    },
    "listPerks": {
        "description": "Lists all perks in the system.",
        "parameters": {},
        "example": "listPerks",
        "category": "Perks"
    },
    "buyPerk": {
        "description": "Consumes a perk point to purchase a perk.",
        "parameters": {"id": {"type": "int", "required": True}},
        "example": "buyPerk --id 1",
        "category": "Perks"
    },
    "changeVenus": {
        "description": "Manages Venus perk related actions (status, request, withdraw).",
        "parameters": {
            "status": {"type": "bool", "required": False},
            "request": {"type": "string", "required": False},
            "withdraw": {"type": "bool", "required": False}
        },
        "example": "changeVenus --request MyBestFriend1337",
        "category": "Perks"
    },
    "rollLoot": {
        "description": "Rolls for loot related to the Abundance of Jupiter perk.",
        "parameters": {"sim": {"type": "bool", "required": False}},
        "example": "rollLoot --sim",
        "category": "Perks"
    },
    "resetConfiguration": {
        "description": "Safely deletes/resets the cloud configuration of a specific solution.",
        "parameters": {},
        "example": "resetConfiguration",
        "category": "Settings"
    },
    "hideSteamAccount": {
        "description": "Hides a Steam account from appearing in the Member's Panel.",
        "parameters": {"name": {"type": "string", "required": True}},
        "example": "hideSteamAccount --name mysteamloginusername",
        "category": "Member Management"
    },
    "showSteamAccount": {
        "description": "Allows a previously hidden Steam account to show.",
        "parameters": {"name": {"type": "string", "required": True}},
        "example": "showSteamAccount --name mysteamloginusername",
        "category": "Member Management"
    },
    "setKeys": {
        "description": "Sets your linking and panic/stop key.",
        "parameters": {
            "link": {"type": "int", "required": False},
            "stop": {"type": "int", "required": False}
        },
        "example": "setKeys --link 122",
        "category": "Settings"
    },
    "getSolution": {
        "description": "Gets the raw executable for a constelia.ai solution.",
        "parameters": {
            "software": {"type": "string", "required": True},
            "os": {"type": "string", "required": False}
        },
        "example": "getSolution --software universe4 --os linux",
        "category": "Software"
    },
    "setProtection": {
        "description": "Sets the protection method of the FC2 solution.",
        "parameters": {"protection": {"type": "int", "required": True}},
        "example": "setProtection --protection 1",
        "category": "Settings"
    },
    "setMemberScripts": {
        "description": "Sets multiple scripts on a license key.",
        "parameters": {"scripts": {"type": "list", "required": True}},
        "example": "setMemberScripts --scripts [140,141]",
        "category": "Scripts"
    },
    "getDivinityChart": {
        "description": "Gets the divinity chart in JSON format.",
        "parameters": {"top5": {"type": "bool", "required": False}},
        "example": "getDivinityChart --top5",
        "category": "Perks"
    },
    "getMinecraftWhitelist": {
        "description": "Lists all members who are allowed on the Minecraft community server.",
        "parameters": {},
        "example": "getMinecraftWhitelist",
        "category": "Member Management"
    },
    "addMinecraftWhitelist": {
        "description": "Adds/Updates a member to the Minecraft community server.",
        "parameters": {
            "name": {"type": "string", "required": True},
            "owner": {"type": "string", "required": True},
            "friend": {"type": "bool", "required": False}
        },
        "example": "addMinecraftWhitelist --name minecraftusername --owner typedef",
        "category": "Member Management"
    },
    "getMemberAsBuddy": {
        "description": "Returns member information for a buddy or VIP.",
        "parameters": {"name": {"type": "string", "required": True}},
        "example": "getMemberAsBuddy --name johnnyappleseed",
        "category": "Member Management"
    },
    "toggleScriptStatus": {
        "description": "Toggles a script on/off.",
        "parameters": {"id": {"type": "int", "required": True}},
        "example": "toggleScriptStatus --id 130",
        "category": "Scripts"
    },
    "getSoftware": {
        "description": "Gets information of a constelia.ai software.",
        "parameters": {
            "name": {"type": "string", "required": True},
            "scripts": {"type": "bool", "required": False},
            "checksum": {"type": "bool", "required": False}
        },
        "example": "getSoftware --name Constellation4 --scripts",
        "category": "Software"
    },
    "getAllSoftware": {
        "description": "Gets all information of all constelia.ai software.",
        "parameters": {},
        "example": "getAllSoftware",
        "category": "Software"
    },
    "getForumPosts": {
        "description": "Gets the latest forum posts.",
        "parameters": {"count": {"type": "int", "required": True}},
        "example": "getForumPosts --count 10",
        "category": "Forum"
    },
    "getConfiguration": {
        "description": "Gets your stored cloud configuration.",
        "parameters": {},
        "example": "getConfiguration",
        "category": "Forum"
    },
    "setConfiguration": {
        "description": "Sets your cloud configuration. Requires POST data.",
        "parameters": {"value": {"type": "string", "required": True, "post": True}},
        "example": "setConfiguration --value \"<json_config_data>\"",
        "category": "Forum"
    },
    "getScript": {
        "description": "Gets information about a script.",
        "parameters": {
            "id": {"type": "int", "required": True},
            "source": {"type": "bool", "required": False},
            "needs_sync": {"type": "bool", "required": False},
            "needs_update": {"type": "bool", "required": False}
        },
        "example": "getScript --id 150 --source",
        "category": "Scripts"
    },
    "getAllScripts": {
        "description": "Gets all scripts.",
        "parameters": {},
        "example": "getAllScripts",
        "category": "Scripts"
    },
    "updateScript": {
        "description": "Updates a script you own or are a team member of. Requires POST data.",
        "parameters": {
            "script": {"type": "string", "required": True, "post": True},
            "content": {"type": "string", "required": True, "post": True},
            "notes": {"type": "string", "required": True, "post": True},
            "categories": {"type": "list", "required": False, "post": True}
        },
        "example": "updateScript --script <script_id> --content \"new code\" --notes \"bug fix\" --categories [0,1]\"",
        "category": "Scripts"
    },
    "getMember": {
        "description": "Gets information about your membership.",
        "parameters": {
            "bans": {"type": "bool", "required": False},
            "history": {"type": "bool", "required": False},
            "scripts": {"type": "bool", "required": False},
            "simple": {"type": "bool", "required": False},
            "private": {"type": "bool", "required": False},
            "xp": {"type": "bool", "required": False},
            "rolls": {"type": "bool", "required": False},
            "fc2t": {"type": "bool", "required": False},
            "hashes": {"type": "bool", "required": False},
            "uploads": {"type": "bool", "required": False},
            "bonks": {"type": "bool", "required": False},
            "achievements": {"type": "bool", "required": False}
        },
        "example": "getMember --scripts --history --bans",
        "category": "Member Management"
    }
}

def load_config():
    """Loads configuration from the config file."""
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_config(config):
    """Saves configuration to the config file."""
    os.makedirs(CONFIG_DIR, exist_ok=True)
    with open(CONFIG_FILE, 'w') as f:
        json.dump(config, f, indent=4)

def parse_arguments(args):
    """Parses command-line arguments into a dictionary."""
    parsed_args = {}
    i = 0
    while i < len(args):
        arg = args[i]
        if arg.startswith("--"):
            key = arg[2:]
            if i + 1 < len(args) and not args[i+1].startswith("--"):
                value = args[i+1]
                parsed_args[key] = value
                i += 1
            else:
                parsed_args[key] = True # Flag argument
        else:
            # This handles the case where the first argument is the command itself
            # and subsequent arguments are not prefixed with --
            pass
        i += 1
    return parsed_args

class CometApp(App):
    CSS = """
    Screen {
        background: #1a0033; /* Dark purple/blue for space */
    }
    Header {
        background: #4a0080; /* Slightly lighter purple */
        color: #e0b0ff; /* Light purple text */
        text-align: center;
    }
    Footer {
        background: #4a0080;
        color: #e0b0ff;
    }
    #output_log {
        background: #0d001a; /* Even darker for log area */
        color: #b0e0e6; /* Light blue/cyan for text */
    }
    #command_input {
        background: #2a004d; /* Medium purple for input */
        color: #ffffff;
        border: solid #8a2be2;
    }
    Tree {
        background: #0d001a;
        color: #b0e0e6;
    }
    Tree > .tree-row--highlight {
        background: #6a00b0;
    }
    Tree > .tree-row--highlight .tree-row--label {
        text-style: bold;
    }
    .hidden {
        display: none;
    }
    ListView {
        border: solid #8a2be2;
        background: #2a004d;
        color: #ffffff;
        height: auto;
        max-height: 10%; /* Adjust as needed */
        dock: bottom;
        overflow-y: auto; /* Enable vertical scrolling */
    }
    ListView > .list-item {
        padding: 0 1; /* Add some padding to list items */
    }
    """

    BINDINGS = [
        ("d", "toggle_dark", "Toggle dark mode"),
        ("q", "quit", "Quit"),
        ("c", "clear", "Clear output"),
    ]

    api_key = reactive(None)
    suggestion_list: ListView | None = None

    def compose(self) -> ComposeResult:
        yield Header(show_clock=True, name="☄️ Comet CLI ☄️")
        with Container() as container:
            self.output_log = RichLog(id="output_log", auto_scroll=True)
            self.api_response_tree = JsonTree("api_response_tree", {}, id="api_response_tree", show_root=False)
            self.command_input = Input(placeholder="Enter command here...", id="command_input")
            self.suggestion_list = ListView(id="suggestion_list", classes="hidden")
            yield self.output_log
            yield self.api_response_tree
            yield self.command_input
            yield self.suggestion_list
        yield Footer(name="🚀 Ready for launch! 🚀")

    def on_mount(self) -> None:
        self.call_after_refresh(self._post_mount_setup)

    def _post_mount_setup(self) -> None:
        self.command_input = self.query_one("#command_input")
        self.output_log = self.query_one("#output_log")
        self.api_response_tree = self.query_one("#api_response_tree")
        self.suggestion_list = self.query_one("#suggestion_list")

        self.command_input.focus()
        self.load_api_key()

    def load_api_key(self) -> None:
        global API_KEY
        config = load_config()
        api_key_path = config.get("api_key_path")

        if not api_key_path or not os.path.exists(api_key_path):
            self.output_log.write("Welcome to comet-cli! It looks like this is your first time running it or your key.txt path is missing/invalid.")
            self.output_log.write("Please provide the absolute path to your key.txt file:")
            self.command_input.placeholder = "Path to key.txt"
        else:
            try:
                with open(api_key_path, 'r') as f:
                    API_KEY = f.read().strip()
                if not API_KEY:
                    self.output_log.write("Warning: key.txt file is empty. Please ensure your API key is in the file.")
                else:
                    self.api_key = API_KEY # Update reactive variable
                    self.output_log.write("API key loaded. Type 'help' for available commands.")
                    self.command_input.placeholder = "Enter command here..."
            except Exception as e:
                self.output_log.write(f"Error reading key.txt: {e}")
                self.output_log.write("Please ensure the file exists and you have read permissions. You may need to delete ~/.comet/config.json and restart.")
                self.app.exit()

    def on_input_changed(self, event: Input.Changed) -> None:
        text = event.value.strip().lower()
        suggestions = []
        if text:
            for cmd in API_METHODS.keys():
                if cmd.lower().startswith(text):
                    suggestions.append(ListItem(cmd))
        
        self.suggestion_list.clear()
        if suggestions:
            self.suggestion_list.extend(suggestions)
            self.suggestion_list.display = True
        else:
            self.suggestion_list.display = False

    def on_list_view_selected(self, event: ListView.Selected) -> None:
        if event.list_view.id == "suggestion_list":
            self.command_input.value = event.item.children[0].renderable.plain
            self.suggestion_list.display = False
            self.command_input.focus()

    def on_input_submitted(self, message: Input.Submitted) -> None:
        if message.input.id == "command_input":
            text = message.value.strip()
            self.query_one("#command_input").value = ""
            self.suggestion_list.display = False # Hide suggestions on submission
            
            # Always show the RichLog and hide the JsonTree when a new command is entered
            self.query_one("#output_log").display = True
            self.query_one("#api_response_tree").display = False

            if not text:
                return

            if self.api_key is None: # Still in key setup phase
                key_path_input = text
                if os.path.exists(key_path_input) and os.path.isfile(key_path_input):
                    config = load_config()
                    config["api_key_path"] = key_path_input
                    save_config(config)
                    self.query_one("#output_log").write(f"Key file path saved: {key_path_input}")
                    self.load_api_key() # Reload to load the API key
                else:
                    self.query_one("#output_log").write("Invalid path or file does not exist. Please try again.")
            else: # Regular command submission
                self.output_log.write(f"comet> {text}")
                parts = text.split()
                command = parts[0]
                args = parts[1:]
                self.execute_command(command, args)

    def action_toggle_dark(self) -> None:
        self.dark = not self.dark

    def action_quit(self) -> None:
        self.app.exit()

    def action_clear(self) -> None:
        self.output_log.clear()
        self.api_response_tree.clear()
        self.api_response_tree.display = False
        self.output_log.display = True

    def execute_command(self, command, args):
        global API_KEY

        output_log = self.query_one("#output_log")
        

        if command == "exit":
            output_log.write("Exiting comet-cli.")
            self.app.exit()
        elif command == "help":
            if args:
                arg = args[0]
                if arg in API_METHODS:
                    method_info = API_METHODS[arg]
                    output_log.write(f"Command: {arg}")
                    output_log.write(f"  Description: {method_info['description']}")
                    output_log.write(f"  Category: {method_info['category']}")
                    output_log.write("  Parameters:")
                    for param, info in method_info["parameters"].items():
                        req = " (Required)" if info["required"] else ""
                        post = " (POST data)" if info.get("post") else ""
                        output_log.write(f"    --{param} ({info['type']}){req}{post}")
                    if "example" in method_info:
                        output_log.write(f"  Example: {method_info['example']}")
                elif arg.capitalize() in CATEGORIES: # Check if it's a category
                    category_name = arg.capitalize()
                    output_log.write(f"Commands in category '{category_name}':")
                    for cmd in CATEGORIES[category_name]:
                        output_log.write(f"  {cmd}: {API_METHODS[cmd]['description']}")
                else:
                    output_log.write(f"Unknown command or category: {arg}")
            else:
                output_log.write("Available categories:")
                for category in CATEGORIES.keys():
                    output_log.write(f"  - {category}")
                output_log.write("")
                output_log.write("Type 'help <command>' for more details on a command.")
                output_log.write("Type 'help <category>' to list commands in a category.")
                output_log.write("Type 'list categories' to see all categories.")
                output_log.write("Type 'q' to quit.")
        elif command == "list":
            if args and args[0] == "categories":
                output_log.write("Available categories:")
                for category in CATEGORIES.keys():
                    output_log.write(f"  - {category}")
            else:
                output_log.write("Usage: list categories")
        elif command == "search":
            if args:
                keyword = args[0].lower()
                found_commands = []
                found_categories = []
                for cmd, info in API_METHODS.items():
                    if keyword in cmd.lower() or keyword in info["description"].lower():
                        found_commands.append(cmd)
                for category, commands in CATEGORIES.items():
                    if keyword in category.lower():
                        found_categories.append(category)
                
                if found_commands:
                    output_log.write(f"Commands matching '{keyword}':")
                    for cmd in found_commands:
                        output_log.write(f"  {cmd}: {API_METHODS[cmd]['description']}")
                if found_categories:
                    output_log.write(f"Categories matching '{keyword}':")
                    for category in found_categories:
                        output_log.write(f"  - {category}")
                if not found_commands and not found_categories:
                    output_log.write(f"No commands or categories found matching '{keyword}'.")
            else:
                output_log.write("Usage: search <keyword>")
        elif command in API_METHODS:
            if not API_KEY:
                output_log.write("API key not loaded. Please restart the CLI to go through the setup process.")
                return

            method_info = API_METHODS[command]
            params = parse_arguments(args)
            
            # Prepare request parameters
            request_params = {"cmd": command}
            if API_KEY:
                request_params["key"] = API_KEY

            post_data = {}

            for param_name, param_info in method_info["parameters"].items():
                if param_info.get("required") and param_name not in params:
                    output_log.write(f"Error: Missing required parameter --{param_name} for command {command}")
                    return
                
                if param_name in params:
                    value = params[param_name]
                    # Type conversion
                    if param_info["type"] == "int":
                        try:
                            value = int(value)
                        except ValueError:
                            output_log.write(f"Error: Parameter --{param_name} expects an integer.")
                            return
                    elif param_info["type"] == "bool":
                        value = str(value).lower() in ("true", "1", "yes")
                    elif param_info["type"] == "list":
                        try:
                            value = eval(value) # Dangerous, but for simplicity in CLI for now
                            if not isinstance(value, list):
                                raise ValueError
                        except (SyntaxError, ValueError):
                            output_log.write(f"Error: Parameter --{param_name} expects a list (e.g., [1,2,3]).")
                            return

                    if param_info.get("post"):
                        post_data[param_name] = value
                    else:
                        request_params[param_name] = value
            
            # Add beautify parameter if requested
            if "beautify" in params and params["beautify"] is True:
                request_params["beautify"] = True

            try:
                if post_data:
                    response = requests.post(BASE_URL, params=request_params, data=post_data)
                else:
                    response = requests.get(BASE_URL, params=request_params)
                
                response.raise_for_status() # Raise an exception for HTTP errors
                
                try:
                    json_response = response.json()
                    # Now we will display this in a Textual TreeView
                    output_log.display = False
                    self.api_response_tree.data = json_response
                    self.api_response_tree.clear()
                    self.api_response_tree.add_json_data(self.api_response_tree.root, json_response)
                    self.api_response_tree.display = True
                    self.api_response_tree.focus()

                except requests.exceptions.JSONDecodeError:
                    output_log.write("Raw response (not JSON):")
                    output_log.write(response.text)

            except requests.exceptions.RequestException as e:
                output_log.write(f"API request failed: {e}")
        else:
            output_log.write(f"Unknown command: {command}. Type 'help' for a list of commands.")

if __name__ == "__main__":
    # Dynamically add --beautify to all API methods for help and completion
    for method_name in API_METHODS:
        API_METHODS[method_name]["parameters"]["beautify"] = {"type": "bool", "required": False}

    app = CometApp()
    app.run()
