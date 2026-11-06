const { mkdir, writeFile } = require("node:fs/promises");
const { dirname, resolve } = require("node:path");

const scriptDirectory = __dirname;
const outputPath = resolve(scriptDirectory, "../data/players.json");
const teamsUrl = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams?limit=100";
const teamNames = {
  ATL: "亞特蘭大老鷹",
  BOS: "波士頓塞爾提克",
  BKN: "布魯克林籃網",
  CHA: "夏洛特黃蜂",
  CHI: "芝加哥公牛",
  CLE: "克里夫蘭騎士",
  DAL: "達拉斯獨行俠",
  DEN: "丹佛金塊",
  DET: "底特律活塞",
  GS: "金州勇士",
  HOU: "休士頓火箭",
  IND: "印第安納溜馬",
  LAC: "洛杉磯快艇",
  LAL: "洛杉磯湖人",
  MEM: "曼菲斯灰熊",
  MIA: "邁阿密熱火",
  MIL: "密爾瓦基公鹿",
  MIN: "明尼蘇達灰狼",
  NO: "紐奧良鵜鶘",
  NY: "紐約尼克",
  OKC: "奧克拉荷馬雷霆",
  ORL: "奧蘭多魔術",
  PHI: "費城 76 人",
  PHX: "鳳凰城太陽",
  POR: "波特蘭拓荒者",
  SAC: "沙加緬度國王",
  SA: "聖安東尼奧馬刺",
  TOR: "多倫多暴龍",
  UTAH: "猶他爵士",
  WSH: "華盛頓巫師"
};
const positionNames = { G: "後衛", F: "前鋒", C: "中鋒" };
const positionStyles = { G: "後衛", F: "前鋒", C: "中鋒" };

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`資料來源回應 ${response.status}：${url}`);
  }
  return response.json();
}

function playerGroup(position) {
  const primaryPosition = position?.abbreviation?.split("-")[0]?.[0];
  if (!positionNames[primaryPosition]) {
    throw new Error(`無法辨識球員位置：${position?.abbreviation || "未提供"}`);
  }
  return primaryPosition;
}

function heightInCentimeters(displayHeight) {
  const match = displayHeight?.match(/(\d+)'\s*(\d+)/);
  if (!match) return displayHeight || "未提供";
  const centimeters = Math.round((Number(match[1]) * 12 + Number(match[2])) * 2.54);
  return `${centimeters} cm`;
}

async function main() {
  const directory = await fetchJson(teamsUrl);
  const teams = directory?.sports?.[0]?.leagues?.[0]?.teams
    ?.map((entry) => entry.team)
    .filter((team) => team?.abbreviation);

  if (teams?.length !== 30) {
    throw new Error(`預期取得 30 支 NBA 球隊，實際取得 ${teams?.length || 0} 支。`);
  }

  const tasks = [...teams];
  const teamRosters = new Map();
  const workerCount = 5;
  const workers = Array.from({ length: workerCount }, async () => {
    while (tasks.length) {
      const team = tasks.shift();
      const roster = await fetchJson(
        `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${encodeURIComponent(team.abbreviation)}/roster`
      );
      if (!Array.isArray(roster.athletes) || roster.athletes.length === 0) {
        throw new Error(`${team.displayName} 沒有回傳球員名單。`);
      }
      teamRosters.set(team.abbreviation, { team, athletes: roster.athletes });
      console.log(`${team.displayName}: ${roster.athletes.length} 位球員`);
    }
  });
  await Promise.all(workers);

  const playersById = new Map();
  for (const [abbreviation, { team, athletes }] of teamRosters) {
    for (const athlete of athletes) {
      if (!athlete?.id || !athlete?.fullName) {
        throw new Error(`${team.displayName} 的球員資料缺少識別碼或姓名。`);
      }
      if (playersById.has(String(athlete.id))) continue;

      const group = playerGroup(athlete.position);
      const number = athlete.jersey || "—";
      const height = heightInCentimeters(athlete.displayHeight);
      const teamLocal = teamNames[abbreviation];
      if (!teamLocal) throw new Error(`尚未設定 ${team.displayName} 的繁體中文隊名。`);
      playersById.set(String(athlete.id), {
        id: String(athlete.id),
        name: athlete.fullName,
        team: team.displayName,
        teamAbbreviation: abbreviation,
        teamLocal,
        teamLogo: team.logo || `https://a.espncdn.com/i/teamlogos/nba/500/${abbreviation.toLowerCase()}.png`,
        position: positionNames[group],
        group: group === "G" ? "guard" : group === "C" ? "center" : "forward",
        number,
        height,
        style: positionStyles[group],
        image: athlete.headshot?.href || `https://a.espncdn.com/i/headshots/nba/players/full/${athlete.id}.png`,
        college: athlete.college?.name || "",
        experience: athlete.experience?.years ?? null
      });
    }
  }

  const players = [...playersById.values()].sort((first, second) =>
    first.name.localeCompare(second.name, "en")
  );
  if (players.length < 400) {
    throw new Error(`球員總數僅有 ${players.length} 人；為避免產生不完整名單，已取消更新。`);
  }

  const data = {
    source: "ESPN public NBA team rosters",
    updatedAt: new Date().toISOString(),
    teamCount: teams.length,
    playerCount: players.length,
    players
  };
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(data)}\n`, "utf8");
  console.log(`已更新 ${players.length} 位球員、${teams.length} 支球隊：${outputPath}`);
}

main().catch((error) => {
  console.error("NBA 球員名單更新失敗：", error);
  process.exitCode = 1;
});
