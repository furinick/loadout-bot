/**
 * Setup Slash Command
 *
 * Configures bot settings via admin-only subcommands.
 * Requires the Administrator permission to use.
 *
 * Subcommands:
 * - `channel` — Sets the channel where loadout submissions are posted for review
 * - `adminrole` — Sets the role that can approve or reject loadout submissions
 *
 * @module setup-command
 */
import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { loadDB, saveDB } from '../db.js';
/**
 * Slash command definition.
 *
 * Restricted to Administrator permission by default.
 * Defines two subcommands: `channel` and `adminrole`.
 */
export const data = new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Configure the loadout bot')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub => sub.setName('channel')
    .setDescription('Set the loadout channel')
    .addChannelOption(opt => opt.setName('loadout').setDescription('Channel where loadouts are posted').setRequired(true)))
    .addSubcommand(sub => sub.setName('adminrole')
    .setDescription('Set the role that can approve/reject loadouts')
    .addRoleOption(opt => opt.setName('role').setDescription('Admin/officer role').setRequired(true)));
/**
 * Executes the setup command.
 *
 * Reads the active subcommand and updates the corresponding bot config value
 * in the database. All replies are ephemeral (only visible to the invoking admin).
 *
 * Subcommand behaviour:
 * - `channel`: Saves the selected channel's ID to `db.config.loadoutChannel`.
 *   The `/submit` command uses this to restrict where submissions are accepted
 *   and where review embeds are posted.
 * - `adminrole`: Saves the selected role's ID to `db.config.adminRole`.
 *   Members with this role can approve or reject submissions via button interactions,
 *   as a fallback to the Administrator permission check.
 *
 * @param interaction - The Discord interaction from the `/setup` command
 */
export async function execute(interaction) {
    const db = loadDB();
    const sub = interaction.options.getSubcommand();
    // ============================================================================
    // CHANNEL SUBCOMMAND
    // ============================================================================
    if (sub === 'channel') {
        db.config.loadoutChannel = interaction.options.getChannel('loadout', true).id;
        saveDB(db);
        return interaction.reply({
            content: `Loadout channel: <#${db.config.loadoutChannel}>`,
            ephemeral: true,
        });
    }
    // ============================================================================
    // ADMINROLE SUBCOMMAND
    // ============================================================================
    if (sub === 'adminrole') {
        db.config.adminRole = interaction.options.getRole('role', true).id;
        saveDB(db);
        return interaction.reply({
            content: `Admin role set to <@&${db.config.adminRole}>`,
            ephemeral: true,
        });
    }
}
//# sourceMappingURL=setup.js.map