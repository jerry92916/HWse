const featuredProfiles = [
  {
    id: "lebron-james",
    name: "LeBron James",
    localName: "勒布朗・詹姆斯",
    team: "LOS ANGELES LAKERS",
    teamLocal: "洛杉磯湖人",
    position: "前鋒",
    group: "forward",
    number: "23",
    height: "206 cm",
    style: "全能組織",
    image: "2544",
    bio: "從俄亥俄州阿克隆出發，LeBron 以閱讀比賽、傳球視野與長年維持的競爭力，成為跨越多個世代的代表人物。他的故事不只關於得分，更關於如何讓隊友一起變得更好。",
    highlights: ["四度 NBA 總冠軍、四度總決賽 MVP", "NBA 歷史例行賽總得分紀錄保持人", "以全面球風與高球商聞名"]
  },
  {
    id: "stephen-curry",
    name: "Stephen Curry",
    localName: "史蒂芬・柯瑞",
    team: "GOLDEN STATE WARRIORS",
    teamLocal: "金州勇士",
    position: "後衛",
    group: "guard",
    number: "30",
    height: "188 cm",
    style: "外線射手",
    image: "201939",
    bio: "Stephen Curry 重新定義了三分球在現代籃球中的影響力。無球跑動、快速出手與超遠射程，讓防守者必須從過半場就開始注意他的存在。",
    highlights: ["四度 NBA 總冠軍、兩度例行賽 MVP", "NBA 史上首位全票例行賽 MVP", "持有 NBA 生涯三分球命中數紀錄"]
  },
  {
    id: "luka-doncic",
    name: "Luka Dončić",
    localName: "盧卡・唐西奇",
    team: "LOS ANGELES LAKERS",
    teamLocal: "洛杉磯湖人",
    position: "後衛",
    group: "guard",
    number: "77",
    height: "198 cm",
    style: "節奏大師",
    image: "1629029",
    bio: "Luka Dončić 年少時便在歐洲頂級賽場累積豐富經驗，進入 NBA 後以沉穩的持球節奏、精準傳球與創造投籃空間的能力受到矚目。",
    highlights: ["2019 年 NBA 年度最佳新秀", "帶領球隊闖進 2024 年 NBA 總決賽", "以擋拆閱讀和後撤步投籃見長"]
  },
  {
    id: "jayson-tatum",
    name: "Jayson Tatum",
    localName: "傑森・塔圖姆",
    team: "BOSTON CELTICS",
    teamLocal: "波士頓塞爾提克",
    position: "前鋒",
    group: "forward",
    number: "0",
    height: "203 cm",
    style: "得分前鋒",
    image: "1628369",
    bio: "Jayson Tatum 從年輕球員逐步成長為波士頓的重要核心，擅長利用身材與腳步完成中距離和外線進攻，也能在高強度防守下為隊友創造機會。",
    highlights: ["2024 年 NBA 總冠軍成員", "多次入選 NBA 全明星賽與年度最佳陣容", "以多位置得分能力與穩定出賽著稱"]
  },
  {
    id: "giannis-antetokounmpo",
    name: "Giannis Antetokounmpo",
    localName: "揚尼斯・安戴托昆波",
    team: "MILWAUKEE BUCKS",
    teamLocal: "密爾瓦基公鹿",
    position: "前鋒",
    group: "forward",
    number: "34",
    height: "211 cm",
    style: "禁區破壞者",
    image: "203507",
    bio: "Giannis Antetokounmpo 從希臘雅典一路走到 NBA 頂尖舞台。他結合長人身材、驚人速度與強悍切入，並以全場攻守影響力帶領公鹿完成冠軍旅程。",
    highlights: ["2021 年 NBA 總冠軍與總決賽 MVP", "兩度獲得例行賽 MVP", "曾獲 NBA 年度最佳防守球員"]
  },
  {
    id: "shai-gilgeous-alexander",
    name: "Shai Gilgeous-Alexander",
    localName: "謝伊・吉爾傑斯－亞歷山大",
    team: "OKLAHOMA CITY THUNDER",
    teamLocal: "奧克拉荷馬雷霆",
    position: "後衛",
    group: "guard",
    number: "2",
    height: "198 cm",
    style: "中距離節奏",
    image: "1628983",
    bio: "Shai Gilgeous-Alexander 擅長以變速、腳步與身體控制突破防線。他耐心尋找出手角度的打法，讓中距離與切入成為極具辨識度的進攻武器。",
    highlights: ["2025 年 NBA 總冠軍與總決賽 MVP", "2025 年 NBA 例行賽 MVP", "以沉著的持球進攻與防守積極度著稱"]
  },
  {
    id: "nikola-jokic",
    name: "Nikola Jokić",
    localName: "尼古拉・約基奇",
    team: "DENVER NUGGETS",
    teamLocal: "丹佛金塊",
    position: "中鋒",
    group: "center",
    number: "15",
    height: "211 cm",
    style: "策應中樞",
    image: "203999",
    bio: "Nikola Jokić 讓中鋒位置有了新的想像。他以廣闊視野和傳球觸感串連全隊，也能透過柔和手感完成低位與外圍進攻，是金塊進攻體系的核心。",
    highlights: ["三度獲得 NBA 例行賽 MVP", "帶領丹佛金塊奪下隊史首座 NBA 總冠軍", "2023 年 NBA 總決賽 MVP"]
  },
  {
    id: "victor-wembanyama",
    name: "Victor Wembanyama",
    localName: "維克多・文班亞馬",
    team: "SAN ANTONIO SPURS",
    teamLocal: "聖安東尼奧馬刺",
    position: "中鋒",
    group: "center",
    number: "1",
    height: "224 cm",
    style: "新世代長人",
    image: "1641705",
    bio: "Victor Wembanyama 以罕見的身高與協調性進入 NBA，能在籃下護框，也能拉到外圍運球與出手。他代表著長人球員持續拓展球場邊界的新方向。",
    highlights: ["2024 年 NBA 年度最佳新秀", "2025 年 NBA 年度最佳防守球員", "兼具護框、外線投射與持球能力"]
  }
];
let players = [];

const grid = document.querySelector("#player-grid");
const searchInput = document.querySelector("#player-search");
const resultCount = document.querySelector("#results-count");
const emptyState = document.querySelector("#empty-state");
const dialog = document.querySelector("#player-dialog");
const dialogContent = document.querySelector("#dialog-content");
const rosterStatus = document.querySelector("#roster-status");
const rosterError = document.querySelector("#roster-error");
const favoriteStorageKey = "courtside-favorites";
const statsCache = new Map();
const featuredByName = new Map(featuredProfiles.map((player) => [normalizeName(player.name), player]));
let activeFilter = "all";
let searchTerm = "";
let favorites = loadFavorites();
let activeProfileRequest = 0;

function normalizeName(name) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();
}

function loadFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem(favoriteStorageKey) || "[]");
    return new Set(Array.isArray(saved) ? saved.filter((id) => typeof id === "string") : []);
  } catch (error) {
    console.warn("無法讀取收藏資料，將以空收藏清單開始。", error);
    return new Set();
  }
}

function saveFavorites() {
  try {
    localStorage.setItem(favoriteStorageKey, JSON.stringify([...favorites]));
  } catch (error) {
    console.error("無法儲存收藏資料。", error);
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function mergeRoster(roster) {
  const nextPlayers = roster.players.map((player) => {
    const featured = featuredByName.get(normalizeName(player.name));
    const teamLocal = player.teamLocal || player.team;
    const highlights = featured?.highlights || [
      `現效力於${teamLocal}`,
      `場上位置：${player.position} · ${player.height}`,
      ...(player.college ? [`大學經歷：${player.college}`] : player.experience !== null ? [`NBA 資歷：${player.experience} 年`] : [])
    ];

    return {
      ...player,
      localName: featured?.localName || "",
      style: featured?.style || player.position,
      bio: featured?.bio || `目前效力於${teamLocal}，場上位置為${player.position}，球衣背號 ${player.number}，身高 ${player.height}。官方球員名單未提供完整個人介紹，本檔案列出目前登錄的球隊與基本資料。`,
      highlights
    };
  });
  const nextIds = new Set(nextPlayers.map((player) => player.id));
  const previousFeaturedIds = new Set(featuredProfiles.map((player) => player.id));

  for (const player of nextPlayers) {
    const featured = featuredByName.get(normalizeName(player.name));
    if (featured && favorites.delete(featured.id)) favorites.add(player.id);
  }
  for (const id of favorites) {
    if (!nextIds.has(id) && !previousFeaturedIds.has(id)) favorites.delete(id);
  }

  players = nextPlayers;
}

function renderPlayers() {
  const query = normalizeName(searchTerm.trim());
  const visiblePlayers = players.filter((player) => {
    const matchesFilter = activeFilter === "all"
      || (activeFilter === "favorites" ? favorites.has(player.id) : player.group === activeFilter);
    const searchableText = normalizeName(`${player.name} ${player.localName} ${player.teamLocal} ${player.team} ${player.position}`);
    return matchesFilter && (!query || searchableText.includes(query));
  });

  grid.innerHTML = visiblePlayers.map((player, index) => `
    <article class="player-card" data-player="${escapeHtml(player.id)}" tabindex="0" role="button" aria-label="查看 ${escapeHtml(player.name)} 的球員介紹">
      <div class="player-image">
        <span class="card-number" aria-hidden="true">${escapeHtml(player.number)}</span>
        <img src="${escapeHtml(player.image)}" alt="${escapeHtml(player.name)}" loading="lazy">
        <span class="card-position">${escapeHtml(player.position)}</span>
        <button class="favorite-button${favorites.has(player.id) ? " is-favorite" : ""}" type="button" data-favorite="${escapeHtml(player.id)}" aria-label="${favorites.has(player.id) ? "取消收藏" : "加入收藏"} ${escapeHtml(player.name)}" aria-pressed="${favorites.has(player.id)}">${favorites.has(player.id) ? "♥" : "♡"}</button>
      </div>
      <div class="card-info">
        <div class="card-team">${escapeHtml(player.team)}</div>
        <h3 class="card-name">${escapeHtml(player.name)}</h3>
        <p class="card-name-local">${escapeHtml(player.localName || `${player.teamLocal} · ${player.position}`)}</p>
        <div class="card-footer"><span class="card-style">${escapeHtml(player.style)} · ${escapeHtml(player.height)}</span><span class="card-arrow" aria-hidden="true">↗</span></div>
      </div>
    </article>
  `).join("");

  resultCount.textContent = `顯示 ${visiblePlayers.length} 位球員`;
  emptyState.hidden = visiblePlayers.length > 0;
  grid.hidden = visiblePlayers.length === 0;
}

function formatStatistic(name, value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return value;
  if (name === "gamesPlayed") return String(Math.round(numericValue));
  if (name.endsWith("Pct")) return `${numericValue.toFixed(1)}%`;
  return numericValue.toFixed(1);
}

async function loadPlayerStats(player) {
  if (statsCache.has(player.id)) return statsCache.get(player.id);

  const request = fetch(`https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${encodeURIComponent(player.id)}/stats?region=us&lang=en`)
    .then((response) => {
      if (!response.ok) throw new Error(`球員數據載入失敗（HTTP ${response.status}）。`);
      return response.json();
    })
    .then((data) => {
      const averages = data.categories?.find((category) => category.name === "averages");
      const latestSeason = averages?.statistics
        ?.filter((season) => season.season?.displayName && !/totals/i.test(season.teamSlug || ""))
        .sort((first, second) => (second.season.year || 0) - (first.season.year || 0))[0];

      if (!averages || !latestSeason?.stats) return null;

      const statNames = ["gamesPlayed", "avgMinutes", "avgPoints", "avgRebounds", "avgAssists", "fieldGoalPct", "threePointFieldGoalPct", "freeThrowPct"];
      const statLabels = {
        gamesPlayed: "出賽",
        avgMinutes: "分鐘",
        avgPoints: "得分",
        avgRebounds: "籃板",
        avgAssists: "助攻",
        fieldGoalPct: "投籃命中率",
        threePointFieldGoalPct: "三分命中率",
        freeThrowPct: "罰球命中率"
      };
      const statistics = statNames.flatMap((name) => {
        const index = averages.names?.indexOf(name) ?? -1;
        const value = index >= 0 ? latestSeason.stats[index] : null;
        return value === null || value === undefined
          ? []
          : [{ name, label: statLabels[name], value: formatStatistic(name, value) }];
      });

      return { season: latestSeason.season.displayName, statistics };
    });

  statsCache.set(player.id, request);
  try {
    const stats = await request;
    statsCache.set(player.id, stats);
    return stats;
  } catch (error) {
    statsCache.delete(player.id);
    throw error;
  }
}

async function renderPlayerStats(player, requestId) {
  const statsContainer = dialogContent.querySelector(".dialog-stats-content");
  if (!statsContainer) return;
  statsContainer.innerHTML = '<p class="stats-message" role="status">正在載入賽季數據…</p>';

  try {
    const stats = await loadPlayerStats(player);
    if (requestId !== activeProfileRequest || !dialog.open) return;

    if (!stats?.statistics.length) {
      statsContainer.innerHTML = '<p class="stats-message">目前沒有可顯示的例行賽數據。</p>';
      return;
    }

    statsContainer.innerHTML = `
      <div class="stats-heading"><strong>例行賽場均</strong><span>${escapeHtml(stats.season)} 賽季</span></div>
      <div class="stats-grid">${stats.statistics.map((stat) => `
        <div class="stat-item"><span>${escapeHtml(stat.label)}</span><strong>${escapeHtml(stat.value)}</strong></div>
      `).join("")}</div>
      <p class="stats-source">數據來源：ESPN</p>
    `;
  } catch (error) {
    console.error(`無法載入 ${player.name} 的賽季數據。`, error);
    if (requestId === activeProfileRequest && dialog.open) {
      statsContainer.innerHTML = '<p class="stats-message" role="alert">賽季數據暫時無法載入，請稍後再試。</p>';
    }
  }
}

function openPlayer(playerId) {
  const player = players.find((item) => item.id === playerId);
  if (!player) return;

  const requestId = ++activeProfileRequest;
  dialogContent.innerHTML = `
    <div class="dialog-portrait">
      <img src="${escapeHtml(player.image)}" alt="${escapeHtml(player.name)}">
    </div>
    <div class="dialog-copy">
      <p class="eyebrow"><span class="eyebrow-line"></span> PLAYER PROFILE / ${escapeHtml(player.number)}</p>
      <h2 id="dialog-name">${escapeHtml(player.name)}</h2>
      <p class="dialog-local-name">${escapeHtml(player.localName || player.teamLocal)}</p>
      <div class="dialog-team-brand"><img src="${escapeHtml(player.teamLogo)}" alt="" loading="lazy"><span>${escapeHtml(player.teamLocal)}</span></div>
      <div class="dialog-meta"><span>${escapeHtml(player.teamLocal)}</span><span>${escapeHtml(player.position)}</span><span>${escapeHtml(player.height)}</span></div>
      <section class="dialog-stats" aria-label="球員賽季數據"><div class="dialog-stats-content"></div></section>
      <p class="dialog-bio">${escapeHtml(player.bio)}</p>
      <ul class="dialog-highlights">${player.highlights.map((highlight) => `<li>${escapeHtml(highlight)}</li>`).join("")}</ul>
    </div>
  `;
  dialog.showModal();
  renderPlayerStats(player, requestId);
}

document.querySelectorAll(".filter-button").forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    document.querySelectorAll(".filter-button").forEach((item) => {
      const selected = item === button;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    renderPlayers();
  });
});

searchInput.addEventListener("input", (event) => {
  searchTerm = event.target.value;
  renderPlayers();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
    event.preventDefault();
    searchInput.focus();
  }
  if (event.key === "Escape" && dialog.open) dialog.close();
});

grid.addEventListener("click", (event) => {
  const favoriteButton = event.target.closest("[data-favorite]");
  if (favoriteButton) {
    const playerId = favoriteButton.dataset.favorite;
    if (favorites.has(playerId)) favorites.delete(playerId);
    else favorites.add(playerId);
    saveFavorites();
    renderPlayers();
    return;
  }
  const card = event.target.closest("[data-player]");
  if (card) openPlayer(card.dataset.player);
});

grid.addEventListener("keydown", (event) => {
  if ((event.key === "Enter" || event.key === " ") && event.target.matches(".player-card")) {
    event.preventDefault();
    openPlayer(event.target.dataset.player);
  }
});

document.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

async function loadRoster() {
  try {
    const response = await fetch("./data/players.json");
    if (!response.ok) throw new Error(`球員名單載入失敗（HTTP ${response.status}）。`);
    const roster = await response.json();
    if (roster.teamCount !== 30 || !Array.isArray(roster.players) || roster.players.length < 400) {
      throw new Error("球員資料不完整，請稍後重新整理頁面。");
    }

    mergeRoster(roster);
    renderPlayers();
    document.querySelector("#player-total").textContent = String(players.length).padStart(3, "0");
    document.querySelector("#player-total-count").textContent = String(players.length);
    const updatedAt = new Date(roster.updatedAt).toLocaleDateString("zh-TW", { timeZone: "Asia/Taipei" });
    rosterStatus.textContent = `30 支球隊 · ${players.length} 位現役球員 · 更新於 ${updatedAt}`;
    rosterError.hidden = true;
  } catch (error) {
    console.error("無法載入 NBA 現役球員名單。", error);
    resultCount.textContent = "無法載入球員名單";
    rosterStatus.textContent = "球員名單暫時無法載入";
    rosterError.hidden = false;
  }
}

loadRoster();
