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

const { token, channelId, name, currentCampaign } = require("./config.json");

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

app.post("/api/pb/:id", async (req, res) => {
  let userId = req.params.id;

  if (!req.body.mapAuthor || req.body.mapAuthor != "Nadeo") {
    res.send("ok");
    return;
  }

  if (!req.body.mapName || !req.body.mapName.startsWith(currentCampaign)) {
    res.send("ok");
    return;
  }

  let track = req.body.mapName.split(" - ")[1];

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

  const channel = discord.channels.cache.get(channelId);
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
