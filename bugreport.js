export async function handleBugReportCommand(ctx, client) {
    const description = ctx.options.getString('description');
    const category = ctx.options.getString('category');
    const screenshot = ctx.options.getAttachment('screenshot');

    // Fetch the designated channel for bug reports in your main server
    const mainServerId = '1036910484709978112';
    const bugReportChannelId = '1249274275118972938';
    const bugReportChannel = await client.channels.fetch(bugReportChannelId);

    // Construct the bug report message
    const bugReportEmbed = {
        title: 'New Bug Report',
        description: `**Category:** ${category}\n**Description:** ${description}`,
        color: 0xff0000,
        timestamp: new Date(),
        footer: {
            text: `Reported by ${ctx.user.tag}`,
            icon_url: ctx.user.displayAvatarURL()
        }
    };

    if (screenshot) {
        bugReportEmbed.image = { url: screenshot.url };
    }

    await bugReportChannel.send({ embeds: [bugReportEmbed] });

    await ctx.reply({ content: 'Thank you for your report! Our devs will look into it.', ephemeral: true });
}