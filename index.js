const fs = require("fs");
const { WebhookClient, EmbedBuilder, Colors, REST, Routes, Client, GatewayIntentBits, Events } = require("discord.js");

const bot = require("./configs/bot.json");
const bots = require("./configs/bots.json");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ]
});

client.login(bot.token);

client.on(Events.ClientReady, async (client) => {
    const webhookUrl = JSON.parse(fs.readFileSync("configs/webhook.json", { encoding: "utf-8" }));
    const haveMessage = fs.existsSync("configs/message.json");

    const webhook = new WebhookClient({ url: webhookUrl.url });

    if (!haveMessage) {
        const message = await webhook.send({
            content: "🔋 Loading status"
        });

        const messageJson = {
            channelId: message.channel_id,
            messageId: message.id
        };

        fs.writeFileSync("configs/message.json", JSON.stringify(messageJson), { encoding: "utf-8" });
    }

    const messageData = JSON.parse(fs.readFileSync("configs/message.json", { encoding: "utf-8" }));

    const guild = await client.guilds.fetch(bot.guildId);

    const botsStatus = await Promise.all(bots.map(async (raw) => {
        const member = await guild.members.fetch(raw.id);
        const presence = member.presence ? member.presence.status : "offline";

        return {
            name: member.user.username,
            value: `\`\`\`${presence == "online" ? "🟢 Bot Ready" : "🔴 Bot Busy"}\`\`\``,
            console: presence == "online" ? "🟢 Bot Ready" : "🔴 Bot Busy"
        }
    }));

    await webhook.editMessage({
        id: messageData.messageId,
        channelId: messageData.channelId
    }, {
        content: `อัปเดตข้อมูลล่าสุดเมื่อ: <t:${Math.round(Date.now() / 1000)}:R>`,
        embeds: [
            new EmbedBuilder()
                .setColor(Colors.Blue)
                .setTitle("🔋 สถานะบอทในเครือ HStudio")
                .setURL("https://hstudio.hewkawar.xyz/invite")
                .addFields(...botsStatus)
        ]
    });

    await client.destroy();

    const statusString = botsStatus.map((value) => `${value.name} - ${value.console}`).join("\n");

    const now = new Date();

    console.log(`Last Updated: ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} - ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`);
    console.log(statusString);
});