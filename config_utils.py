import json
import os

def load_config():
    """Load configuration from the default config file location."""
    config_path = os.path.expanduser("~/.comet/config.json")
    
    # Check if config file exists
    if not os.path.exists(config_path):
        raise FileNotFoundError(f"Config file not found at {config_path}")
    
    # Load config file
    with open(config_path, 'r') as f:
        config = json.load(f)
    
    return config

def load_api_key(api_key_path):
    """Load API key from the specified path in the config."""
    # Check if API key file exists
    if not os.path.exists(api_key_path):
        raise FileNotFoundError(f"API key file not found at {api_key_path}")
    
    # Load API key
    with open(api_key_path, 'r') as f:
        api_key = f.read().strip()
    
    return api_key

def get_api_key():
    """Get the API key by loading config and then the key file."""
    try:
        config = load_config()
        api_key_path = config.get("api_key_path")
        if not api_key_path:
            raise ValueError("api_key_path not found in config.json")
        
        api_key = load_api_key(api_key_path)
        return api_key
    except Exception as e:
        print(f"Error loading API key: {e}")
        return None
