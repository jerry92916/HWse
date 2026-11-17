# courtside-roster

Rust library for validating and searching the JSON roster used by the COURTSIDE NBA site.

```rust
use courtside_roster::{get_player, search_players};
use serde_json::Value;

let roster: Value = serde_json::from_str(&std::fs::read_to_string("players.json")?)?;
let guards = search_players(&roster, "los angeles", Some("guard"))?;
let lebron = get_player(&roster, "2544")?;
println!("{} guards; found LeBron: {}", guards.len(), lebron.is_some());
# Ok::<(), Box<dyn std::error::Error>>(())
```

`validate_roster` checks all 30 teams, required player fields, unique IDs and position groups. `search_players` searches names, teams, abbreviations, positions and jersey numbers without regard to letter case. `get_player` returns `None` when the ID is unknown.

Run tests with `cargo test`. Publish to crates.io after verifying the package name and authenticating with a crates.io token.
