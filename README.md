# Fantasy.Comet2 - A Recode of Fantasy.Comet

Fantasy.Comet2 is the next generation of Fantasy.Comet, a comprehensive hub for private game assistance software. This project represents a complete recode, focusing on a modern architecture, improved user experience, and enhanced functionality.

## Features Overview

Fantasy.Comet2 aims to provide a robust and intuitive platform with comprehensive integration of Constelia.ai functionalities. The ultimate goal is to integrate all available API functions into the hub, providing a single, powerful interface for all Constelia.ai interactions.

### Current Features (Implemented with Dedicated Dashboards/Components)

- **Scripts Management:**
    - Get script information (`getScript`, `getAllScripts`)
    - Update scripts (`updateScript`)
    - Toggle script status (`toggleScriptStatus`)
    - Set multiple scripts at once (`setMemberScripts`)
- **Member Information:**
    - Get membership information (`getMember`)
    - Get other member's info (buddy/VIP only) (`getMemberAsBuddy`)
    - Hide/show Steam accounts (`hideSteamAccount`, `showSteamAccount`)
    - Set linking and panic/stop keys (`setKeys`)
- **Software Information:**
    - Get information about Constelia software (`getSoftware`, `getAllSoftware`)
- **Configuration Management:**
    - Get/set/reset cloud configuration (`getConfiguration`, `setConfiguration`, `resetConfiguration`)
- **Forum Features:**
    - Get latest forum posts (`getForumPosts`)
    - Send commands to Member's Panel (`sendCommand`)
- **Perks Management:**
    - Get divinity chart (`getDivinityChart`)
    - Respec perks (`respecPerks`)
    - List all available perks (`listPerks`)
    - Purchase perks (`buyPerk`)
    - Manage Venus perk pairing (`changeVenus`)
    - Roll Abundance of Jupiter loot (`rollLoot`)
- **Settings:**
    - Set language preference (`setLanguage`)

### Upcoming Features (Planned for Integration)

These features are defined in the API but do not yet have dedicated user interfaces or full integration within the application:

- **Software (Download & Protection):**
    - Download raw executable (`getSolution`)
    - Set FC2 protection method (`setProtection`)

- **FC2T (Fantasy.Comet2 Projects):**
    - Get all FC2T projects (`getFC2TProjects`)
    - Get FC2T project by ID (`getFC2TProject`)
    - Enable/disable FC2T project (`toggleProjectStatus`)
    - Set multiple FC2T projects (`setMemberProjects`)
- **Builds:**
    - List all available builds (`getBuilds`)
    - Create or update a build (`createBuild`)
    - Delete your current build (`deleteBuild`)
    - Upload file to i.constelia.ai (`upload`)
    - Change upload URL (`setUpload`)
- **Minecraft Whitelist:**
    - List Minecraft server whitelist (`getMinecraftWhitelist`)
    - Add member to Minecraft whitelist (`addMinecraftWhitelist`)
    - Remove from Minecraft whitelist (`deleteMinecraftWhitelist`)

### User-friendly Interface

Built with Next.js and Shadcn UI components, ensuring a modern, responsive, and intuitive user experience.

## Getting Started

To set up and run the project locally, follow these steps:

### Prerequisites

- Node.js (LTS version recommended)
- npm (or pnpm/yarn, but npm is used in this project)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd fantasy.comet
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Development Server

To start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Building for Production

To build the application for production:

```bash
npm run build
```

### Running in Production

To start the production server:

```bash
npm run start
```
