import R from "./common/ramda.js";
import Connect4 from "./common/Connect4.js";
import Json_rpc from "./Json_rpc.js";

// String literals.
const image_sources = [
    "./assets/ground.png",
    "./assets/barricade.png",
    "./assets/zombie.png"
];
const image_alts = [
    "Empty slot",
    "Barricade",
    "Zombie"
];

const result_text = [
    "The zombie siege has ended in an uneasy stalemate.",
    "The zombie siege has been neutralised.",
    "Zombies have sieged the complex."
];

const player_types = {
    "1": "Siege Defender",
    "2": "Zombies"
};

// Stats4 Methods:
const record_game = Json_rpc.method("record_game");
const get_statistics = Json_rpc.method("get_statistics");

const game_board = document.getElementById("game_board");

const result_dialog = document.getElementById("result_dialog");


// Home player / away player are displayed on the left / right sidebars.
// Player 1 / Player 2 go first / second. These alternate each game.
let home_player = document.getElementById("home_name").value;
let away_player = document.getElementById("away_name").value;
let home_player_type;

let board = Connect4.empty_board();
let player = 1; // Current player to ply.

// This is my helper function to shorten document.getElementById.
const el = (id) => document.getElementById(id);

const slot_images = R.range(0, 7).map(function (column_index) {
    const column_div = document.createElement("div");
    column_div.className = "column";
    column_div.tabIndex = 0;
    column_div.setAttribute("aria-label", `Column ${column_index}`);

    column_div.onclick = function () {
        const free_columns = Connect4.free_columns(board);
        if (!free_columns.includes(column_index)) {
            return;
        }
        board = Connect4.ply(player, column_index, board);
        player = Connect4.player_to_ply(board);
        redraw_board();

        if (Connect4.is_ended(board)) {
            let result;
            let winning_player;
            if (Connect4.is_winning_for_player(1, board)) { // Defenders
                result = 1;
                winning_player = (
                    home_player_type === 1
                    ? home_player
                    : away_player
                );
                document.getElementById("result_winner").textContent = (
                    `${winning_player} wins!`
                );
            } else if (Connect4.is_winning_for_player(2, board)) { // Zombies
                result = 2;
                winning_player = (
                    home_player_type === 2
                    ? home_player
                    : away_player
                );
                document.getElementById("result_winner").textContent = (
                    `${winning_player} wins!`
                );
            } else {
                result = 0;
                document.getElementById("result_winner").textContent = (
                    "Game is tied."
                );
            }
            document.getElementById("result_message").textContent = (
                result_text[result]
            );

            if (home_player_type === 1) { // Who went first?
                record_game(home_player, away_player, result).then(
                    update_statistics(home_player, away_player)
                );
            } else {
                record_game(away_player, home_player, result).then(
                    update_statistics(home_player, away_player)
                );
            }

            result_dialog.showModal();
        }
    };

    column_div.onkeydown = function (event) {
        if (
            event.key === "Enter" ||
            event.key === "Space" ||
            event.key === "ArrowDown"
        ) {
            column_div.onclick();
        }
        if (event.key === "ArrowLeft" && column_div.previousSibling) {
            column_div.previousSibling.focus();
        }
        if (event.key === "ArrowRight" && column_div.nextSibling) {
            column_div.nextSibling.focus();
        }
    };

    game_board.append(column_div);

    return R.reverse(R.range(0, 6).map(function () {
        const image = document.createElement("img");
        column_div.append(image);
        return image;
    }));
});

result_dialog.onclick = function () {
    board = Connect4.empty_board();
    player = Connect4.player_to_ply(board); // reset player to ply.
    swap_player_types();
    redraw_board();
    result_dialog.close();
};

result_dialog.onkeydown = result_dialog.onclick;

const swap_player_types = function () {
    home_player_type = 3 - home_player_type; // 2 → 1, 1 → 2
    el("home_player_type").textContent = player_types[home_player_type];
    el("away_player_type").textContent = player_types[3 - home_player_type];
    el("home_player_type_image").setAttribute(
        "src",
        image_sources[home_player_type]
    );
    el("home_player_type_image").setAttribute(
        "alt",
        image_alts[home_player_type]
    );
    el("away_player_type_image").setAttribute(
        "src",
        image_sources[3 - home_player_type]
    );
    el("away_player_type_image").setAttribute(
        "alt",
        image_alts[3 - home_player_type]
    );
};

const redraw_board = function () {
    slot_images.forEach(function (column, column_index) {
        column.forEach(function (image, row_index) {
            const token = board[column_index][row_index];
            image.setAttribute("src", image_sources[token]);
            image.setAttribute("alt", image_alts[token]);
            image.className = (
                token === 0
                ? "free"
                : "filled"
            );
        });
    });
    Connect4.winning_slots(board).forEach(function ([column_index, row_index]) {
        const image = slot_images[column_index][row_index];
        image.className = "winning";
        image.setAttribute("alt", `Winning ${image.getAttribute("alt")}`);
    });
    if (Connect4.player_to_ply(board) === home_player_type) {
        document.getElementById("home_ready").textContent = "You're up!";
        document.getElementById("away_ready").textContent = "Wait your turn…";
    } else {
        document.getElementById("home_ready").textContent = "Wait your turn…";
        document.getElementById("away_ready").textContent = "You're up!";
    }
};

const update_statistics = function (home_player, away_player) {
    return function (stats) {
        const stats_home = stats[home_player];
        const stats_away = stats[away_player];

        el("home_name").textContent = home_player;
        el("home_elo").textContent = Math.round(stats_home.elo);
        el("home_p1_wins").textContent = stats_home.player_1_wins;
        el("home_p1_losses").textContent = stats_home.player_1_losses;
        el("home_p1_draws").textContent = stats_home.player_1_draws;
        el("home_p2_wins").textContent = stats_home.player_2_wins;
        el("home_p2_losses").textContent = stats_home.player_2_losses;
        el("home_p2_draws").textContent = stats_home.player_2_draws;
        el("home_current_streak").textContent = stats_home.current_streak;
        el("home_longest_streak").textContent = stats_home.longest_streak;

        el("away_name").textContent = away_player;
        el("away_elo").textContent = Math.round(stats_away.elo);
        el("away_p1_wins").textContent = stats_away.player_1_wins;
        el("away_p1_losses").textContent = stats_away.player_1_losses;
        el("away_p1_draws").textContent = stats_away.player_1_draws;
        el("away_p2_wins").textContent = stats_away.player_2_wins;
        el("away_p2_losses").textContent = stats_away.player_2_losses;
        el("away_p2_draws").textContent = stats_away.player_2_draws;
        el("away_current_streak").textContent = stats_away.current_streak;
        el("away_longest_streak").textContent = stats_away.longest_streak;

        // I probably overdid it with the stats.
    };
};

document.getElementById("home_name").onchange = function () {
    home_player = document.getElementById("home_name").value;
    away_player = document.getElementById("away_name").value;
    get_statistics([home_player, away_player]).then(
        update_statistics(home_player, away_player)
    );
};

document.getElementById("away_name").onchange = (
    document.getElementById("home_name").onchange
);

get_statistics([home_player, away_player]).then(
    update_statistics(home_player, away_player)
);

home_player_type = 2;
swap_player_types();


game_board.firstChild.focus();
redraw_board();
