# WannaGetDrunk

WannaGetDrunk v1.0 is a local multiplayer quiz and buzzer game. A host runs the server on a laptop and players join from phones on the same Wi-Fi network.

## Run locally

Requires Node.js 20.9+ and npm. From this directory:

```bash
npm install
npm run dev
```

Open `http://localhost:3000` on the host computer. The server prints the LAN URL in the terminal. Players scan the QR code shown in the lobby or visit that URL on the same network. Allow inbound connections to port 3000 in the host firewall.

The first run creates `.env` and `data/wannagetdrunk.db` automatically. The SQLite file is retained across restarts and ignored by Git. To change the port or interface, set `PORT` or `HOST` in the environment. For a production build, run `npm run build` and `npm run start`.

## Play

1. Select **Set up a game**, create a quiz, mark one correct answer per question, and save it. Each question has 2–4 answers. You can enable automatic buzzer activation in the quiz settings.
2. Select **Host game**. Share the lobby code or QR link and start when players have joined.
3. Display the host screen to the room. Answers stay hidden until the buzzer opens. Activate it for each question, or let the quiz setting open it automatically as questions start. The first valid server-received press gets the answer turn.
4. Correct answers score one point. Wrong answers show **DRINK 5**, eliminate that player and answer option for the current question, and reopen the buzzer. A timeout eliminates the player but leaves the options intact.
5. Advance through the questions and view the final rankings. The session ends automatically after the last question. You can also end an open session from its host screen or from **Open sessions** on the setup screen. Players who refresh or reconnect keep their identity and score.

After a session ends, its quiz can be edited. Saving an edited quiz creates a new version on the shelf, while the ended session keeps its original questions and results.

The quiz shelf supports JSON import and export. Imported files use schema version 1 and contain no player records or scores. Team scores are the sum of their members' points.

## Development

```bash
npm test
npm run build
```

The multiplayer integration check in `tests/integration.mjs` expects a running server at `http://localhost:3100` with a disposable database. For example, create an empty SQLite file at `/tmp/wgd-test.db`, then run `PORT=3100 DATABASE_URL=file:/tmp/wgd-test.db npm run dev` in one terminal and `node tests/integration.mjs` in another.

The custom Node server runs Next.js and Socket.IO on one port. Prisma stores quiz templates, sessions, players, attempts, and scores in SQLite. The server controls buzzer selection, countdowns, scoring, and phase transitions. Active games pause after a server restart and require the host to resume.

## Original concept

Web application for a team based game. There are 3 modes that need to be considered

## Set up mode

Requirements: 
1. Set up the limit of teams (if any)
2. Set amount of questions
3. Set each individual question
4. Set the possible answers for each question (MAX 4 possible answers, MIN 2 possible answers)
    - set countdown time
5. Export a set game
6. Import a set game

## Sign-up mode

Players should be able to sign up to the game and choose their name. This is done primarily through mobile devices connecting to the web app. For instance `host/gameID`

## Game mode

Game mode is on the mobile devices when the host have chosen to start the game. When the game is started a question with possible answers are displayed on the host screen. The players press their buzzer to answer. It should operate similarily to the `quizzbutton.app`. It is free to copy. The first player to press the buzzer gets the opportunity to select an answer on their device. If the answer is correct the player gets one point. If it is wrong there is 0 points. 

step by step: 
1. Question is showed on the host screen with possible answers
2. Buzzer is activated
3. Buzzer is pressed, first is chosen and shown on all devices including host screen
4. Possible answers need to be selected (maybe kahoot inspired with one color per answer). X second countdown to answer
5. Answer is deemed correct or wrong (flash green if correct, red if not correct.)
    - if not correct the player tht buzzed is out, the wrong answer is removed and the remaining players can buzz in. This goes on until the right answer is chosen. Which makes it lucky for the last one if all has answered wrong. 
    - Note if there is no more teams left the host should be able to move to the next question. 
    - Wrong answers with the red screen should say "drink 5" 
6. Points awarded need to be stored and summarized for each player

## Host mode

This mode displays the question and possible answers. The host screen is similar to kahoot. This should enable the host to control the game, move on to the next question and so on. 
