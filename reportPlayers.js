const analyticsDb = require("./analytics/analyticsDbManager");

function reportPlayerActivity() {
  const total = analyticsDb.getTotalPlayers();
  const allPlayers = analyticsDb.getAllPlayerEvents();

  console.log(`\n=== Player Tracking Report ===`);
  console.log(`Total unique players: ${total}\n`);

  allPlayers.forEach((entry, index) => {
    console.log(`${index + 1}. ${entry.player_id} - First seen: ${entry.first_seen}`);
  });

  console.log(`\n=== End of Report ===\n`);
}
function exportPlayerActivityToJson() {
  const allPlayers = analyticsDb.getAllPlayerEvents();
  const outputPath = path.join(__dirname, "analytics", "player_report.json");

  fs.writeFileSync(outputPath, JSON.stringify(allPlayers, null, 2), "utf-8");
  console.log(`✅ Player report written to ${outputPath}`);
}

reportPlayerActivityToConsole();
exportPlayerActivityToJson();