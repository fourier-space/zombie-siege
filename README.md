# Zombie Siege
Zombie Siege is a
[Connect Four](https://en.wikipedia.org/wiki/Connect_Four)
style game as an example submission for the
[Computing 2: Applications](https://github.com/fourier-space/Computing-2-Applications)
coursework.

![Screenshot of Zombie Seige gameplay](screenshot.png)

It defines a module,
`web-app/common/Connect4.js`,
for representing and playing
Connect Four style games in pure Javascript.
This module exposes pure functions in its
[API](https://fourier-space.github.io/zombie-siege/Connect4.html)
that act on a board object.

A set of unit tests are written for this module,
`web-app/tests/Connect4.test.js`.
The test set is not exhaustive, but tests the game-end conditions.

A front-end application is written to wrap the game module in a browser based
web app,
`web-app/browser/`
This web app is designed with a zombies theme.

Finally a web-server, at `web-app/server/` static serves the front-end app,
as the documentation, as well as providing a JSON-RPC interface for a
statistics module that logs player wins and losses and Elo scores.
The statistics module, `web-app/server/Stats4.js` also has a
[documented API](https://fourier-space.github.io/zombie-siege/Stats4.html).
