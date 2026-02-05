const express = require("express");
const {
  updateCotdSheet,
  updateCotdInfo,
  updateCampaign,
  getRankings,
  getLeaderboard,
} = require("./controllers/sheetController");

const {
  client: discord
} = require("./discord.js");

const { token, channelId, campaignChannelId, name, currentCampaign } = require("./config.json");

const { EmbedBuilder } = require("discord.js");
const {promises: fs} = require("fs");
const {sleep} = require("./utility-functions");

const medalReplacements = {
  ":champion_medal:": "<:champion_medal:1466893294528233492>",
  ":at_medal:": "<:author_medal:1466894049347637268>",
  ":gold_medal:": "<:gold_medal:1466894779458781326>",
  ":silver_medal:": "<:silver_medal:1466895022656979280>",
  ":bronze_medal:": "<:bronze_medal:1466895258716733514>",
  ":no_medal:": "",
}

const nameToMapReplacements = {
  "China 2026": "Winter 2026 - 21",
  "France 2026": "Winter 2026 - 22",
  "USA 2026": "USA 2026 - 23",
  "Brazil 2026": "Winter 2026 - 24",
  "Greece 2026": "Winter 2026 - 25",
}

const app = express();

app.use(express.json());

app.post("/cotd", async (req, res) => {
  const { player, date, div, rank } = req.body;

  if (!player || !date || !div || !rank) {
    return res.status(400).json({ error: "Missing required parameters." });
  }

  try {
    const result = await updateCotdSheet(player, date, div, rank);
    res.json(result);
  } catch (error) {
    console.error("Error updating sheet: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/campaign", async (req, res) => {
  const { player, track, time } = req.body;

  if (!player || !track || !time) {
    return res.status(400).json({ error: "Missing required parameters." });
  }

  try {
    const result = await updateCampaign(player, track, time);
    res.json(result);
  } catch (error) {
    console.error("Error updating sheet: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/campaign/ranking", async (req, res) => {
  const { track, time } = req.body;

  if (!track || !time) {
    return res.status(400).json({ error: "Missing required parameters." });
  }

  const rank = await getRankings(time, track);
  res.json({ rank });
})

app.post("/cotdinfo", async (req, res) => {
  const { track, type, date, playerCount } = req.body;

  if (!track || !type || !date) {
    return res.status(400).json({ error: "Missing required parameters." });
  }

  try {
    const result = await updateCotdInfo(track, type, date, playerCount);
    res.json(result);
  } catch (error) {
    console.error("Error updating sheet: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/lb", async (req, res) => {
  try {
    const result = await getLeaderboard();
    res.json(result);
  } catch (error) {
    console.error("Error updating sheet: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/", async (req, res) => {
  res.send("ok");
});

app.post("/api/cotd/:id", async (req, res) => {
  let userId = req.params.id;

  if (!req.body.ServerName || !req.body.GameMode) {
    res.send("ok");
    return;
  }

  const serverName = req.body.ServerName;
  const gameMode = req.body.GameMode;

  if (gameMode !== "TM_KnockoutDaily_Online" || !serverName.includes("#1")) {
    res.send("ok");
    return;
  }

  if (!userId) {
    res.status(400).json({ error: "User ID is required" });
    return;
  }

  const fileData = await fs.readFile("data/userData.json", "utf-8");
  const userNames = JSON.parse(fileData);
  let user = userNames.find((user) => user.id === userId);

  if (!user || !user.name) {
    res.send("ok");
    return;
  }

  if (!req.body.Net_TMGame_Tracking_MatchRank || !req.body.Net_Knockout_KnockoutReward_CupRank) {
    res.send("ok");
    return;
  }

  const matchRank = req.body.Net_TMGame_Tracking_MatchRank;
  const cupRank = req.body.Net_Knockout_KnockoutReward_CupRank;

  const div = Math.ceil(cupRank / 64);

  const today = new Date();
  const day = today.getDate().toString().padStart(2, "0");
  const month = (today.getMonth() + 1).toString().padStart(2, "0");
  const year = today.getFullYear().toString();
  const date = `${month}/${day}/${year}`;

  let color = 0xcccccc;

  if (matchRank <= 32) {
    color = 0xCD7F32;
  }
  if (matchRank <= 16) {
    color = 0xC0C0C0;
  }
  if (matchRank <= 8) {
    color = 0xD4AF37;
  }
  if (matchRank <= 4) {
    color = 0x008000;
  }
  if (matchRank <= 1) {
    color = 0x8C1CF5;
  }

  const channel = discord.channels.cache.get(campaignChannelId);
  const embed = new EmbedBuilder()
      .setTitle(`:trophy: ${user.name} just ranked #${matchRank}!`)
      // .setURL(req.body.MapLink)
      .setColor(color)
      .addFields(
          { name: "Rank", value: `#${matchRank}`, inline: true },
          { name: "Overall rank", value: `#${cupRank}`, inline: true },
          { name: "Division", value: `${div}`, inline: true },
      )
      .setFooter({ text: date })
      .setTimestamp();

  await channel.send({ embeds: [embed] });

  try {
    const result = await updateCotdSheet(user.name, date, div, matchRank);
    res.json(result);
  } catch (error) {
    console.error("Error updating sheet: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/pb/:id", async (req, res) => {
  let userId = req.params.id;

  if (!req.body.mapAuthor || req.body.mapAuthor != "Nadeo") {
    res.send("ok");
    return;
  }

  if (!req.body.mapName) {
    res.send("ok");
    return;
  }

  let convertedMapName = req.body.mapName;
  convertedMapName = nameToMapReplacements[convertedMapName] || convertedMapName;

  if (!convertedMapName.startsWith(currentCampaign)) {
    res.send("ok");
    return;
  }

  let track = convertedMapName.split(" - ")[1];

  const fileData = await fs.readFile("data/userData.json", "utf-8");
  const userNames = JSON.parse(fileData);
  let user = userNames.find((user) => user.id === userId);

  if (!user || !user.name) {
    res.send("ok");
    return;
  }

  res.send(user.name);

  let medal = req.body.medal;

  for (const [key, value] of Object.entries(medalReplacements)) {
    if (medal.includes(key)) {
      medal = value;
    }
  }

  try {
    const result = await updateCampaign(user.name, track, req.body.time);

    if (result.matchFound) {
      success = true;
      timeSave = result.timeSave;
    } else {
      success = false;
    }

  } catch (error) {
    console.error("Error:", error);
  }

  let rank = undefined;

  if (success) {
    let rankAttempts = 0;

    do {
      rankAttempts++;
      rank = (await getRankings(req.body.time, track));

      let rankString = `placing #${rank}`;
      if (rank === undefined) {
        rankString = `rank calculation retry ${rankAttempts}...`;
      }

      if (rankAttempts > 20) {
        rankString = `rank calculation failed after 20 attempts.`;
      }

      await sleep(1000);
    } while (rank === undefined && rankAttempts < 20);
  }

  const channel = discord.channels.cache.get(campaignChannelId);
  const embed = new EmbedBuilder()
      .setTitle(req.body.mapName)
      .setURL(req.body.mapLink)
      .setDescription(`[${user.name}](${req.body.userLink}) set a new PB! ${medal}`)
      .setColor(0x5865F2)
      .addFields(
          { name: "Time", value: `${req.body.time}${req.body.timeDelta}`, inline: true },
          { name: "Club", value: `#${rank}`, inline: true },
          { name: "World", value: `#${req.body.rank}`, inline: true }
      )
      .setFooter({ text: name })
      .setTimestamp();

  await channel.send({ embeds: [embed] });
})

app.listen(8080, () => {
  discord.login(token);
  console.log("Backend running on port 8080");
});
