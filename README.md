# Fantasy.Comet

A Textual-based Terminal User Interface (TUI) application for interacting with the Constelia.ai API.

## Prerequisites

- Python 3.7 or higher
- A Constelia.ai API key (required to use this tool)
- Internet connection

## What is this tool for?

Fantasy.Comet is a command-line interface that allows users to interact with the Constelia.ai API directly from the terminal. It provides a user-friendly TUI with features like:

- Collapsible JSON response display for complex API responses
- Syntax highlighting for better readability
- Auto-completion for commands
- Real-time forum posts display
- Custom handling for specific API endpoints like getBuilds

**Note: Without a valid Constelia.ai API key, this tool is useless as it cannot make any API calls.**

## Setup Instructions

1. Clone or download this repository
2. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Create a configuration file at `~/.comet/config.json` with the following structure:
   ```json
   {
     "api_key_path": "/path/to/your/api/key/file.txt"
   }
   ```
4. Create a text file containing your Constelia.ai API key at the path specified in the config file

## Building/Running the Project

To run the application, simply execute:

```bash
python main.py
```

The application will start in fullscreen mode. Use the following key bindings:

- `Enter`: Submit a command
- `Tab`: Accept autocomplete suggestion
- `Ctrl+C`: Quit the application
- Arrow keys: Navigate collapsible JSON trees

## Usage

Type any Constelia.ai API command in the input field and press Enter to execute it. For example:

- `getMember` - Get your membership information
- `getBuilds` - Get a list of builds sorted by popularity
- `getAchievements` - Get your achievements

The application will display the JSON response in a collapsible tree format for easy navigation.
