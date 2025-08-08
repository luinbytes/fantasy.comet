# Fantasy.Comet

A Textual-based Terminal User Interface (TUI) application for interacting with the Constelia.ai API.

[![Discord](https://img.shields.io/discord/1280919597180260475?color=7289da&label=Discord&logo=discord&logoColor=white)](https://discord.gg/V4w2zVZJ3g)

## Features

- **TUI Interface**: Modern terminal-based user interface built with Textual
- **API Integration**: Direct integration with Constelia.ai API
- **Collapsible JSON Display**: Interactive tree view for complex JSON responses
- **Syntax Highlighting**: Color-coded output for better readability
- **Command Auto-completion**: Suggestions for commands as you type
- **Real-time Forum Posts**: Live display of community forum updates
- **Custom Response Handling**: Specialized display for specific API endpoints like getBuilds
- **Keyboard Navigation**: Full keyboard support for all interface elements

## Prerequisites

- Python 3.7 or higher
- A Constelia.ai API key (required to use this tool)
- Internet connection

## What is this tool for?

Fantasy.Comet is a command-line interface that allows users to interact with the Constelia.ai API directly from the terminal. It provides a user-friendly TUI with advanced features for viewing and navigating JSON responses from the API.

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

## Contributing

Contributions are welcome! To ensure your contributions match the current codebase, please follow these practices:

- Follow the existing code style and structure
- Add comprehensive comments for any new functionality
- Test your changes thoroughly before submitting
- Keep commits focused on a single feature or bug fix
- Update the README.md if you add new features or change existing functionality

## Community

Join our Discord community for support, updates, and discussions:

[https://discord.gg/V4w2zVZJ3g](https://discord.gg/V4w2zVZJ3g)
