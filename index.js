import 'dotenv/config'; // Load environment variables.
import { createServer } from 'http';
import { Client, Intents } from 'discord.js';
import Akinator from './Akinator.js';
import { handleBugReportCommand } from './bugreport.js';
import { handlePingCommand } from './ping.js';

if (!process.env.DISCORD_TOKEN) {
    console.error('"DISCORD_TOKEN" is required to run the bot.');
    process.exit();
}

// Ensure the bot listens on port 8080 for incoming requests.
createServer((_, res) => res.end('Pong')).listen(8080, () => {
    console.log('Server is listening on port 8080');
});

const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
});

// Login to Discord API
client.login(process.env.DISCORD_TOKEN);

client.on('ready', async () => {
    console.log('Connected to Discord API!');

    // Function to update bot activities
    const updateActivity = () => {
        const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
        let toggle = true;
        setInterval(() => {
            if (toggle) {
                client.user.setActivity({
                    name: `/akinator`,
                    type: 'PLAYING'
                });
            } else {
                client.user.setActivity({
                    name: `${totalUsers} users`,
                    type: 'WATCHING'
                });
            }
            toggle = !toggle;
        }, 3000);
    };

    updateActivity();

    const commands = [
        {
            name: 'akinator',
            description: 'Play Akinator Game',
            options: [
                {
                    name: 'language',
                    description: 'Select the language you prefer. (default: English)',
                    type: 'STRING',
                    required: false,
                    choices: [
                        { name: 'English', value: 'en' },
                        { name: 'Arabic', value: 'ar' },
                        { name: 'Spanish', value: 'es' },
                        { name: 'French', value: 'fr' },
                        { name: 'Italian', value: 'it' },
                        { name: 'Japanese', value: 'jp' },
                        { name: 'Russian', value: 'ru' },
                        { name: 'Portuguese', value: 'pt' },
                        { name: 'Turkish', value: 'tr' },
                        { name: 'Chinese', value: 'cn' }
                    ]
                }
            ]
        },
        {
            name: 'bugreport',
            description: 'Report a bug to the Akinator bot devs',
            options: [
                {
                    name: 'description',
                    description: 'Describe the bug you encountered',
                    type: 'STRING',
                    required: true
                },
                {
                    name: 'category',
                    description: 'Select the category of the bug',
                    type: 'STRING',
                    required: true,
                    choices: [
                        { name: 'UI Issue', value: 'UI Issue' },
                        { name: 'Logic Error', value: 'Logic Error' },
                        { name: 'Performance Issue', value: 'Performance Issue' },
                        { name: 'Other', value: 'Other' }
                    ]
                },
                {
                    name: 'screenshot',
                    description: 'Attach a screenshot (optional)',
                    type: 'ATTACHMENT',
                    required: false
                }
            ]
        },
        {
            name: 'ping',
            description: 'Get the bot\'s latency'
        }
    ];

    // Deploy Global /slash commands
    await client.application.commands.set(commands);
});

client.on('interactionCreate', async (ctx) => {
    if (!ctx.isCommand()) return;

    if (ctx.commandName === 'akinator') {
        await ctx.deferReply();

        const language = ctx.options.getString('language', false) || 'en';
        const game = new Akinator(language);

        await game.start();
        await ctx.editReply({
            components: [game.component],
            embeds: [game.embed]
        });

        // To Ignore non-playing users.
        const filter = interaction => interaction.user.id === ctx.user.id;
        const channel = await client.channels.fetch(ctx.channelId);

        while (!game.ended) {
            try {
                await game.ask(channel, filter); // will throw an error if did not reply within 30 seconds
                if (!game.ended) await ctx.editReply({ embeds: [game.embed], components: [game.component] });
            } catch (err) {
                if (err instanceof Error) console.error(err);
                return await ctx.editReply({
                    components: [],
                    embeds: [],
                    content: 'Timeout.'
                });
            }
        }

        await game.stop();
        await ctx.editReply({ components: [], embeds: [game.embed] });
    }

    if (ctx.commandName === 'bugreport') {
        await handleBugReportCommand(ctx, client);
    }

    if (ctx.commandName === 'ping') {
        await handlePingCommand(ctx, client);
    }
});