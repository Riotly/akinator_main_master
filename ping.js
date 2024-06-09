export async function handlePingCommand(ctx, client) {
    const sent = await ctx.reply({ content: 'Pinging...', fetchReply: true, ephemeral: true });
    const latency = sent.createdTimestamp - ctx.createdTimestamp;
    await ctx.editReply(`Pong! Latency is ${latency}ms. API Latency is ${Math.round(client.ws.ping)}ms`);
}