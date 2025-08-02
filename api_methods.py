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