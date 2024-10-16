const fs = require("fs");
const { WebhookClient, EmbedBuilder, Colors } = require("discord.js");

const bots = require("./configs/bots.json");

async function App() {
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

    const botsStatus = await Promise.all(bots.map(async (raw) => {
        const statusRes = await fetch(`https://tapi.hewkawar.xyz/api/v1/discord/users/${raw.id}`, {
            headers: {
                "User-Agent": "Bot-Status-Bettery/1.0.0"
            }
        });

        const status = await statusRes.json();
        
        return {
            name: status.user.username,
            value: `\`\`\`${status.presence == "online" ? "🟢 Bot Ready" : status.presence == "dnd" ? "⛔ Bot Busy" : status.presence == "idle" ? "🌙 Bot Idle" : "🔴 Bot Offline"}\`\`\``,
            console: status.presence == "online" ? "🟢 Bot Ready" : status.presence == "dnd" ? "⛔ Bot Busy" : status.presence == "idle" ? "🌙 Bot Idle" : "🔴 Bot Offline"
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

    const statusString = botsStatus.map((value) => `${value.name} - ${value.console}`).join("\n");

    const now = new Date();

    console.log(`Last Updated: ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} - ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`);
    console.log(statusString);
}

App();

setInterval(() => {
    App();
}, 60_000); // Every 1 minute