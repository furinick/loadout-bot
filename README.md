# ARMA3 Loadout Bot

Hi this is a little discord bot i made to manage custom loadouts for the unit
Phoenix PMC, which i am a part of.

It allows users to send their ACE arsenal loadout extract string and for the
mission maker to just paste the units using the generate command and the debug
terminal inside 3Den.

If you are a unit admin wanting to implement this, in its current state, i advise
you delegate the task to your biggest nerd admin

## Features

- Submit loadouts
- Approve or deny loadouts
- Generate units inside 3Den with the submitted and approved loadouts

## Requirements

- Node.js v18+
- An Arma 3 installation (for generating `data/items.json`)
- A Discord server where you have admin access
- A discord bot with a few permissions (detailed later)

## Installation

### Actual Code Setup

1. Clone the repo and install dependencies:

```bash
   git clone 
   cd 
   npm install
```

1. Create a `.env` file in the root directory:
DISCORD_TOKEN=
CLIENT_ID=
GUILD_ID=

### Discord Bot Setup

1. Go to the discord developer portal and create a new application
2. Go to OAuth2 and paste the client ID in the .env file
3. Under Bot, enable the Server Members Intent
4. Under OAuth2 > URL Generator, select the `bot` and `applications.commands`
   scopes, then under Bot Permissions select Administrator
5. Copy the generated URL, open it in your browser, and invite the bot to your server
6. Copy the Bot Token and paste it into DISCORD_TOKEN in your .env
7. Register slash commands with your guild:

  ```bash
     npx tsx src/deploy-commands.ts
  ```

Start the bot:

  ```bash
    npx tsx src/index.ts
  ```

## Item Database Setup

dump_items.sqf contains the sqf script to run inside the debug console to
acquire all items inside your mod pack, if you are on windows it will copy
to your clipboard, yes it takes a while and will look like your ARMA3 froze.
If you are on linux ask a friend to run it and send the contents to you. The
generated output goes into `data/db.json`

## Commands

- `/setup adminrole {role}` - Sets what role will be able to approve loadouts.
- `/setup channel {channel}` - Where submissions will be posted.
- `/submit {slot name} {role} {squad} {ACE Arsenal extract}` - Submits a
  loadout for approval.
- `/weight {?username}` - Lets you see the weight of each item, optionally if
  not yours, who's?
- `/remove {?username}` - Lets you unsubmit your loadout or remove someone's
  loadout
- `/generate` - Gives you a nice little sqf script, to use it go into 3Den, point
  your camera to where you want your players, press ctrl+D, paste the script and
  run it. If everything went right the units should be spawned.

## Notes / Known Limitations

- As of now you are expected to create your own bot to use this, it should not be
  that hard.
- You can change the roles and squad names inside the code, if you already had
  loadouts submitted you might need to manually delete the entire db.json and
  ask people to resubmit.
  - On that note if you rename the squads (again ask the nerd) create a branch.

## AI usage note

I'm personally not a big fan of what AI has become but i accept it can do menial
coding work, i feel it is necessary to inform that quite a lot of code here was
written by Claude, no not Claude code, but the one in the browser, i dont want
to get brain rot on my job. If you need assurance I'm an actual information systems
student and actually enjoy coding instead of making this for the hell of it. It
still took a lot of manual tweaking to get it working.
