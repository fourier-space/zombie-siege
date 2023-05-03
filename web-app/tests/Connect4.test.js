import Connect4 from "../Connect4.js";
import R from "../ramda.js";

const DISPLAY_MODE = "to_string";

const display_functions = {
    "json": JSON.stringify,
    "to_string": Connect4.to_string_with_tokens(Connect4.token_strings.disks)
};
const display_board = function (board) {
    try {
        return "\n" + display_functions[DISPLAY_MODE](board);
    } catch (ignore) {
        return "\n" + JSON.stringify(board);
    }
};

/**
 * Returns if the board is in a valid state.
 * A board is valid if all the following are true:
 * - The board is a rectangular 2d array containing only 0, 1, or 2 as elements.
 * - Player 1 has the same number of tokens as Player 2 or has exactly one more.
 * - There are no empty slots in columns below filled ones.
 * - At most one player has a winning configuration.
 * @memberof Connect4.test
 * @function
 * @param {Board} board The board to test.
 * @throws if the board fails any of the above conditions.
 */
const throw_if_invalid = function (board) {
    // Rectangular array.
    if (!Array.isArray(board) || !Array.isArray(board[0])) {
        throw new Error(
            "The board is not a 2D array: " + display_board(board)
        );
    }
    const height = board[0].length;
    const rectangular = R.all(
        (column) => column.length === height,
        board
    );
    if (!rectangular) {
        throw new Error(
            "The board is not rectangular: " + display_board(board)
        );
    }

    // Only valid tokens
    const token_or_empty = [0, 1, 2];
    const contains_valid_tokens = R.pipe(
        R.flatten,
        R.all((slot) => token_or_empty.includes(slot))
    )(board);
    if (!contains_valid_tokens) {
        throw new Error(
            "The board contains invalid tokens: " + display_board(board)
        );
    }

    // Player 1 has equal or one more token than Player 2.
    const count_token_type_in_board = (token) => R.pipe(
        R.flatten,
        R.count(R.equals(token))
    );
    const count_of_player_1_tokens = count_token_type_in_board(1)(board);
    const count_of_player_2_tokens = count_token_type_in_board(2)(board);
    if (!(
        count_of_player_1_tokens === count_of_player_2_tokens ||
        count_of_player_1_tokens === count_of_player_2_tokens + 1
    )) {
        throw new Error(
            "There is an imbalance of tokens on the board. " +
            `Player 1 has ${count_of_player_1_tokens}, ` +
            `Player 2 has ${count_of_player_2_tokens}: ` +
            display_board(board)
        );
    }

    // All empty slots at the top.
    /*
     - Determine how many zeros in a column.
     - Take that many elements from the top.
     - All elements taken should be zero.
    */
    const no_floating_tokens_in_column = (column) => R.all(
        R.equals(0),
        R.takeLast(R.count(R.equals(0), column), column)
    );
    const no_floating_tokens = R.all(no_floating_tokens_in_column, board);
    if (!no_floating_tokens) {
        throw new Error(
            "There are empty slots below filled ones: " + display_board(board)
        );
    }

    // At most one player has a winning configuration.
    const winning_for_1 = Connect4.is_winning_for_player(1, board);
    const winning_for_2 = Connect4.is_winning_for_player(2, board);
    if (winning_for_1 && winning_for_2) {
        throw new Error(
            "The board is winning for both players: " + display_board(board)
        );
    }
};

describe("Empty Board", function () {
    it("An empty board is a valid board", function () {
        const empty_board = Connect4.empty_board();
        throw_if_invalid(empty_board);
    });

    it("An empty board is not ended.", function () {
        const empty_board = Connect4.empty_board();
        if (Connect4.is_ended(empty_board)) {
            throw new Error(
                "An empty board should not be ended: " +
                display_board(empty_board)
            );
        }
    });

    it("An empty board has all free columns.", function () {
        const empty_board = Connect4.empty_board();
        const all_free_slots = R.pipe(
            R.flatten,
            R.all(R.equals(0))
        )(empty_board);
        if (!all_free_slots) {
            throw new Error(
                "The empty board has filled slots: " +
                display_board(empty_board)
            );
        }
    });

    it("An empty board has no winning player", function () {
        const empty_board = Connect4.empty_board();
        if (
            Connect4.is_winning_for_player(1, empty_board) ||
            Connect4.is_winning_for_player(2, empty_board)
        ) {
            throw new Error(
                "The empty board has a winning player: " +
                display_board(empty_board)
            );
        }
    });
});

/**
 * This function make all available plies on a board and will throw if,
 * - The resultant board is invalid,
 * - The game ends in a win for the player not making the ply.
 * - The game does not end, but the player that just made a ply is still up.
 * @memberof Connect4.test
 * @function
 * @param {Board} board The board to test.
 * @throws if the board fails any of the above conditions.
 */
const throw_if_bad_ply = function (board) {
    const player_to_ply = Connect4.player_to_ply(board);
    const free_column_indices = Connect4.free_columns(board);
    free_column_indices.forEach(function (column_index) {
        const next_board = Connect4.ply(
            player_to_ply,
            column_index,
            board
        );
        throw_if_invalid(next_board);
        const other_player = 3 - player_to_ply; // 2 → 1, 1 → 2
        if (Connect4.is_ended(next_board)) {
            if (Connect4.is_winning_for_player(other_player, board)) {
                throw new Error(
                    "A player who did not make the last move has won: " +
                    "Player " + other_player +
                    display_board(board) + "\n\n" +
                    display_board(next_board)
                );
            }
        } else if (Connect4.player_to_ply(next_board) !== other_player) {
            throw new Error(
                "After a ply, the next player should be up." +
                "Origninal player: " + player_to_ply + " " +
                " Next player: " + other_player +
                display_board(board) + "\n\n" +
                display_board(next_board)
            );
        }
    });
};
describe("Plies", function () {
    it(
        `Given a game board that is not ended,
When the current player makes a ply in a free column,
Then the resulting board is:
a valid board that is not ended with the next player to ply,
or a valid board that is ended and not won by the next player.`,
        function () {
            const not_ended_boards = [
                Connect4.empty_board(),
                [
                    [1, 2, 0, 0, 0, 0],
                    [2, 1, 0, 0, 0, 0],
                    [2, 1, 1, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0]
                ],
                [
                    [0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0],
                    [1, 2, 0, 0, 0, 0],
                    [2, 1, 0, 0, 0, 0],
                    [2, 1, 1, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0],
                    [2, 1, 2, 0, 0, 0]
                ]
            ];
            not_ended_boards.forEach(throw_if_bad_ply);
        }
    );
});

const throw_if_not_ended = function (ended_board) {
    if (!Connect4.is_ended(ended_board)) {
        throw new Error(
            "An ended board is not being reported as ended: " +
            display_board(ended_board)
        );
    }
};

describe("Ended boards", function () {
    it("A board with no free columns should be ended", function () {
        const ended_boards = [
            [
                [1, 1, 1, 2, 2, 2],
                [2, 2, 2, 1, 1, 1],
                [1, 1, 1, 2, 2, 2],
                [2, 2, 2, 1, 1, 1],
                [1, 1, 1, 2, 2, 2],
                [2, 2, 2, 1, 1, 1],
                [1, 1, 1, 2, 2, 2]
            ]
        ];
        ended_boards.forEach(throw_if_not_ended);
    });

    it(
        `A board with a horizontal four-in-a-row,
should be ended in a win for the player with that configuration.`,
        function () {
            const horizontal_win = [
                [0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0],
                [1, 2, 0, 0, 0, 0],
                [1, 2, 0, 0, 0, 0],
                [1, 2, 0, 0, 0, 0],
                [1, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0]
            ];
            if (
                !Connect4.is_ended(horizontal_win) &&
                !Connect4.is_winning_for_player(1, horizontal_win)
            ) {
                throw new Error(
                    `A board with a winning configuration,
should be marked as won
${display_board(horizontal_win)}`
                );
            }
        }
    );

    it(
        `A board with a vertical four-in-a-row,
should be ended in a win for the player with that configuration.`,
        function () {
            const vertical_win = [
                [0, 0, 0, 0, 0, 0],
                [1, 0, 0, 0, 0, 0],
                [1, 2, 0, 0, 0, 0],
                [1, 2, 2, 2, 2, 0],
                [2, 0, 0, 0, 0, 0],
                [1, 1, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0]
            ];
            if (
                !Connect4.is_ended(vertical_win) &&
                !Connect4.is_winning_for_player(2, vertical_win)
            ) {
                throw new Error(
                    `A board with a winning configuration,
should be marked as won
${display_board(vertical_win)}`
                );
            }
        }
    );

    it(
        `A board with a positive diagonal four-in-a-row,
should be ended in a win for the player with that configuration.`,
        function () {
            const positive_diagonal_win = [
                [0, 0, 0, 0, 0, 0],
                [2, 1, 0, 0, 0, 0],
                [1, 2, 0, 0, 0, 0],
                [1, 2, 2, 0, 0, 0],
                [2, 1, 2, 2, 0, 0],
                [1, 1, 1, 0, 0, 0],
                [0, 0, 0, 0, 0, 0]
            ];
            if (
                !Connect4.is_ended(positive_diagonal_win) &&
                !Connect4.is_winning_for_player(2, positive_diagonal_win)
            ) {
                throw new Error(
                    `A board with a winning configuration,
should be marked as won
${display_board(positive_diagonal_win)}`
                );
            }
        }
    );

    it(
        `A board with a negative diagonal four-in-a-row,
should be ended in a win for the player with that configuration.`,
        function () {
            const negative_diagonal_win = [
                [1, 1, 1, 0, 0, 0],
                [2, 1, 2, 2, 0, 0],
                [1, 2, 2, 0, 0, 0],
                [1, 2, 0, 0, 0, 0],
                [2, 1, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0]
            ];
            if (
                !Connect4.is_ended(negative_diagonal_win) &&
                !Connect4.is_winning_for_player(2, negative_diagonal_win)
            ) {
                throw new Error(
                    `A board with a winning configuration,
should be marked as won
${display_board(negative_diagonal_win)}`
                );
            }
        }
    );
});
