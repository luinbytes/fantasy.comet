export const allApiMethods = [
  // Scripts
  {
    name: "getScript",
    params: ["id"],
    description: "Gets information about a script including source code",
    category: "scripts",
  },
  { name: "getAllScripts", params: [], description: "Get all scripts", category: "scripts" },
  {
    name: "updateScript",
    params: ["script", "content", "notes", "categories?"],
    description: "Update a script you own (POST required)",
    category: "scripts",
  },
  { name: "toggleScriptStatus", params: ["id"], description: "Toggle a script on/off", category: "scripts" },
  { name: "setMemberScripts", params: ["scripts"], description: "Set multiple scripts at once", category: "scripts" },

  // Member
  { name: "getMember", params: ["flags?"], description: "Get your membership information", category: "member" },
  {
    name: "getMemberAsBuddy",
    params: ["name"],
    description: "Get another member's info (buddy/VIP only)",
    category: "member",
  },
  { name: "hideSteamAccount", params: ["name"], description: "Hide a Steam account", category: "member" },
  {
    name: "showSteamAccount",
    params: ["name"],
    description: "Show a previously hidden Steam account",
    category: "member",
  },
  { name: "setKeys", params: ["link?", "stop?"], description: "Set linking and panic/stop keys", category: "member" },

  // Software
  {
    name: "getSoftware",
    params: ["name"],
    description: "Get information about Constelia software",
    category: "software",
  },
  { name: "getAllSoftware", params: [], description: "Get all Constelia software information", category: "software" },
  {
    name: "getSolution",
    params: ["software", "os?"],
    description: "Download raw executable (use curl)",
    category: "software",
  },
  {
    name: "setProtection",
    params: ["protection"],
    description: "Set FC2 protection method (0-4)",
    category: "software",
  },

  // Config
  { name: "getConfiguration", params: [], description: "Get your cloud configuration", category: "config" },
  {
    name: "setConfiguration",
    params: ["value"],
    description: "Set cloud configuration (POST required)",
    category: "config",
  },
  { name: "resetConfiguration", params: [], description: "Reset/delete cloud configuration", category: "config" },

  // Forum
  { name: "getForumPosts", params: ["count"], description: "Get latest forum posts (0-20)", category: "forum" },
  { name: "sendCommand", params: ["command"], description: "Send commands to Member's Panel", category: "forum" },

  // Perks
  { name: "getDivinityChart", params: [], description: "Get the divinity chart in JSON format", category: "perks" },
  { name: "respecPerks", params: [], description: "Remove all perks (costs 3000 XP)", category: "perks" },
  { name: "listPerks", params: [], description: "List all available perks", category: "perks" },
  { name: "buyPerk", params: ["id"], description: "Purchase a perk with perk points", category: "perks" },
  {
    name: "changeVenus",
    params: ["status|request|withdraw"],
    description: "Manage Venus perk pairing",
    category: "perks",
  },
  { name: "rollLoot", params: [], description: "Roll Abundance of Jupiter loot", category: "perks" },

  // AI
  { name: "heyConstelia", params: ["message"], description: "Communicate with Constelia AI", category: "ai" },
  {
    name: "teachConstelia",
    params: ["data", "info?", "wipe?"],
    description: "Teach Constelia custom information",
    category: "ai",
  },

  // FC2T
  { name: "getFC2TProjects", params: [], description: "Get all FC2T projects", category: "fc2t" },
  { name: "getFC2TProject", params: ["id"], description: "Get FC2T project by ID", category: "fc2t" },
  { name: "toggleProjectStatus", params: ["id"], description: "Enable/disable FC2T project", category: "fc2t" },
  { name: "setMemberProjects", params: ["projects"], description: "Set multiple FC2T projects", category: "fc2t" },

  // Builds
  { name: "getBuilds", params: [], description: "List all available builds", category: "builds" },
  { name: "createBuild", params: ["tag?", "private?"], description: "Create or update a build", category: "builds" },
  { name: "deleteBuild", params: ["tag?"], description: "Delete your current build", category: "builds" },
  {
    name: "upload",
    params: ["expire?", "no_scramble?"],
    description: "Upload file to i.constelia.ai",
    category: "builds",
  },
  {
    name: "setUpload",
    params: ["old_url", "new_url"],
    description: "Change upload URL (Superstar only)",
    category: "builds",
  },

  // Minecraft
  {
    name: "getMinecraftWhitelist",
    params: [],
    description: "List Minecraft server whitelist (VIP only)",
    category: "minecraft",
  },
  {
    name: "addMinecraftWhitelist",
    params: ["name", "owner"],
    description: "Add member to Minecraft whitelist",
    category: "minecraft",
  },
  {
    name: "deleteMinecraftWhitelist",
    params: ["owner"],
    description: "Remove from Minecraft whitelist",
    category: "minecraft",
  },

  // Settings
  { name: "setLanguage", params: ["lang?"], description: "Set your language preference", category: "settings" },
]