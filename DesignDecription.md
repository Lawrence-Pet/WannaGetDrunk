# WannaGetDrunk
## Web Application — Design & Technical Specification

**Version:** 1.0  
**Application Type:** Local-first, real-time multiplayer quiz game  
**Primary Devices:** Desktop/laptop (host), smartphones (players)  
**Database:** SQLite  
**Architecture:** Self-hosted web application

---

# 1. Project Overview

## 1.1 Description

**WannaGetDrunk** is a real-time, multiplayer, team-based quiz and buzzer game designed for social gatherings.

One person acts as the **host**, controlling the game from a laptop, desktop, or tablet. Other participants join the game using their smartphones by opening a unique game URL.

The host displays questions and multiple-choice answers on a shared screen.

Players compete to be the first to press a virtual buzzer. The fastest player earns the opportunity to answer the question.

Correct answers award points. Incorrect answers eliminate the player from the current question and trigger a drinking penalty.

The game continues until someone answers correctly or no eligible players remain.

The application must:

- Run locally without requiring external cloud services.
- Support multiple simultaneous mobile connections.
- Provide real-time synchronization between devices.
- Persist games, questions, players, and scores using SQLite.
- Allow hosts to create, edit, export, and import games.
- Provide an engaging, responsive, game-show-inspired interface.
- Support individual players and optional team-based competition.
- Allow players to reconnect without losing their identity or scores.

## 1.2 Design Principles

1. **Simple setup:** A host should be able to create and start a game quickly.
2. **Mobile-first gameplay:** Players primarily interact through smartphones.
3. **Real-time interaction:** Buzzer presses and game updates must synchronize immediately.
4. **Fair competition:** The server determines which player pressed the buzzer first.
5. **Persistent storage:** Game configurations and results survive application restarts.
6. **Local hosting:** No external hosting or internet connection should be required when all devices are on the same local network.
7. **Clear visual feedback:** Players must immediately understand the current game state.
8. **Host authority:** The host controls game progression and can resolve unexpected situations.

---

# 2. Technology Stack

## 2.1 Recommended Framework

Use the following technologies:

| Component | Technology | Purpose |
|---|---|---|
| Frontend | Next.js (App Router) | Web application framework |
| Language | TypeScript | Type-safe development |
| Styling | Tailwind CSS | Responsive user interface |
| UI Components | shadcn/ui | Reusable interface components |
| Backend | Node.js | Server runtime |
| API | Next.js Route Handlers | REST endpoints |
| Real-time communication | Socket.IO | Bidirectional multiplayer communication |
| Database | SQLite | Persistent local storage |
| ORM | Prisma | Database access and migrations |
| Validation | Zod | Input and configuration validation |
| State management | Zustand | Client-side interface state |
| Icons | Lucide React | Interface icons |

## 2.2 Why This Stack?

### Next.js

Next.js provides frontend and backend functionality within one project.

Benefits include:

- Straightforward local deployment.
- Server-side functionality.
- Responsive web interfaces.
- API endpoints.
- TypeScript support.
- A single codebase.

### SQLite

SQLite is ideal for this application because it:

- Requires no separate database server.
- Stores data in a local database file.
- Supports persistent game configurations.
- Supports player and team statistics.
- Works without internet connectivity.
- Is easy to back up.

The SQLite database should be stored at:

`./data/wannagetdrunk.db`

The application must automatically create the data directory and initialize the database during first-time setup.

### Socket.IO

Socket.IO handles real-time multiplayer functionality.

It is responsible for:

- Player connections.
- Player registration updates.
- Buzzer activation.
- Buzzer presses.
- Determining the first valid buzzer press.
- Answer selection.
- Countdown synchronization.
- Score updates.
- Game-state transitions.
- Player disconnections and reconnections.

**Important:** Use a persistent Node.js server process with a custom Next.js server to support Socket.IO.

The application must not rely on serverless functions for real-time gameplay.

---

# 3. Application Architecture

## 3.1 High-Level Architecture

```text
                    WANNA GET DRUNK
                   LOCAL WEB SERVER
                          |
                Next.js + Node.js
                          |
          +---------------+---------------+
          |               |               |
      Host UI         Player UI       Setup UI
          |               |               |
          +---------------+---------------+
                          |
                    Socket.IO
                          |
                  Game State Engine
                          |
                   Prisma ORM
                          |
                       SQLite
                          |
                wannagetdrunk.db
```

## 3.2 Application Roles

The application has two primary roles.

### Host

The host can:

- Create games.
- Configure questions.
- Configure answers.
- Configure countdown timers.
- Configure team limits.
- Import and export games.
- Open a game lobby.
- View connected players.
- Start the game.
- Advance questions.
- View scores.
- End the game.
- Review results.

### Player

Players can:

- Join using a game URL.
- Choose a display name.
- Join or create a team when permitted.
- View their current score.
- Press the buzzer.
- Select an answer when they win the buzzer.
- View correct and incorrect answer feedback.
- View their current game status.
- View the final leaderboard.

Players must not be able to control the host interface or modify game configurations.

---

# 4. Application Modes

The application contains four primary modes:

1. Setup Mode
2. Sign-up Mode
3. Game Mode
4. Host Mode

The host and player interfaces operate simultaneously during gameplay.

---

# 5. Setup Mode

## 5.1 Purpose

Setup Mode allows the host to create, configure, and manage reusable quiz games.

## 5.2 Game Configuration

Each game configuration must contain:

| Field | Description | Required |
|---|---|---|
| Game name | Name of the quiz | Yes |
| Description | Optional description | No |
| Team mode | Individual or team-based gameplay | Yes |
| Maximum teams | Optional team limit | No |
| Number of questions | Total number of questions | Yes |
| Questions | Configured quiz questions | Yes |
| Answers | Multiple-choice answers | Yes |
| Answer countdown | Time allowed to answer | Yes |

### Team Configuration

The host must be able to choose between:

**Individual Mode**

Every player competes independently.

**Team Mode**

Players belong to teams.

The host can optionally configure the maximum number of teams.

If no limit is configured, the number of teams is unrestricted.

Team scores are calculated from the points earned by their members.

A player may belong to only one team per game session.

## 5.3 Question Configuration

The host must be able to:

- Add questions.
- Edit questions.
- Delete questions.
- Reorder questions.
- Duplicate questions.
- Configure answers.
- Configure answer countdowns.

Each question must contain:

```json
{
  "id": "question-uuid",
  "text": "What is the capital of Norway?",
  "countdownSeconds": 10,
  "answers": [
    {
      "id": "answer-1",
      "text": "Oslo",
      "isCorrect": true
    },
    {
      "id": "answer-2",
      "text": "Bergen",
      "isCorrect": false
    },
    {
      "id": "answer-3",
      "text": "Trondheim",
      "isCorrect": false
    },
    {
      "id": "answer-4",
      "text": "Stavanger",
      "isCorrect": false
    }
  ]
}
```

### Question Rules

1. Each question must have at least **2 answers**.
2. Each question must have at most **4 answers**.
3. Exactly **one answer must be correct**.
4. Every answer must contain nonempty text.
5. Every question must contain nonempty text.
6. Countdown time must be configurable.
7. Questions must have a defined display order.

### Countdown Configuration

Each question has an answer countdown.

Default:

`10 seconds`

Suggested configurable range:

`3–60 seconds`

The countdown begins when the winning player is given permission to answer.

The server is authoritative for the countdown.

If the countdown expires before an answer is submitted, the attempt is considered incorrect.

The player is eliminated from the current question, but no specific wrong answer is removed because none was selected.

## 5.4 Question Editor UI

The editor should provide:

- Question text input.
- Answer text inputs.
- Correct-answer selector.
- Add-answer button.
- Remove-answer button.
- Countdown selector.
- Question preview.
- Save button.

The interface must prevent saving invalid questions.

## 5.5 Game Export

The host must be able to export a configured game as JSON.

Example filename:

`friday-night-quiz.json`

Exported data should contain:

- Game metadata.
- Team configuration.
- Questions.
- Answers.
- Correct-answer information.
- Countdown settings.
- Question order.

Export files must not contain:

- Player identities.
- Player session tokens.
- Historical scores.
- Internal database IDs that are not needed for portability.

## 5.6 Game Import

The host must be able to import a previously exported JSON game.

Import workflow:

1. Select JSON file.
2. Parse file.
3. Validate the schema.
4. Display game preview.
5. Confirm import.
6. Save imported game to SQLite.

Invalid files must produce descriptive validation errors.

Imported games should receive new internal database identifiers to avoid conflicts.

Include a schema version in exported files for future compatibility.

---

# 6. Sign-up Mode

## 6.1 Purpose

Sign-up Mode allows players to join a game session using their smartphones.

## 6.2 Game Sessions

When the host opens a game lobby, the application creates a unique session identifier.

Example:

`ABCD12`

Players can join using:

`http://HOST_IP:3000/game/ABCD12`

The host screen should display:

- Game name.
- Game session code.
- Join URL.
- QR code.
- Connected players.
- Teams.
- Number of participants.
- Start Game button.

The QR code must contain the full join URL.

## 6.3 Joining a Game

Player workflow:

1. Open the join URL.
2. Enter a display name.
3. Select a team if team mode is enabled.
4. Press **Join Game**.
5. Enter the waiting lobby.

### Player Name Rules

- Names must be between 1 and 24 characters.
- Names must be unique within the current game session, ignoring case.
- Names should be displayed safely as text.
- Empty names are not allowed.

## 6.4 Player Lobby

The player lobby should display:

```text
+--------------------------------+
|        WANNA GET DRUNK         |
|                                |
|         GAME: ABCD12           |
|                                |
|         Welcome, Alex!         |
|                                |
|         Team: Blue             |
|                                |
|       Waiting for host...      |
|                                |
|         Players: 8             |
|                                |
+--------------------------------+
```

The lobby must update automatically when players join or leave.

## 6.5 Player Reconnection

Players should be able to reconnect after:

- Refreshing the browser.
- Temporarily losing Wi-Fi.
- Locking their smartphone.
- Switching browser tabs.

Use a securely generated player session token stored in the browser.

On reconnection:

1. Validate the token.
2. Restore the player's identity.
3. Restore their team.
4. Restore their score.
5. Restore their current game state.

The application must prevent duplicate player records when a player reconnects.

Player tokens must not be included in public game-state messages.

## 6.6 Late Joining

Default behavior:

Players may join while the game is in the lobby.

Once the game starts, new registrations are disabled.

Previously registered players may reconnect at any time.

The host may optionally enable late joining in a future version.

---

# 7. Game Mode

## 7.1 Purpose

Game Mode is the interactive player experience.

Players primarily use their smartphones to:

- Press the buzzer.
- Submit answers.
- Receive visual feedback.
- Track points.

The game follows a server-controlled state machine.

## 7.2 Game State Machine

Define the following states:

```text
LOBBY
  |
  v
QUESTION_DISPLAY
  |
  v
BUZZER_OPEN
  |
  | First valid buzzer
  v
PLAYER_SELECTED
  |
  v
ANSWER_COUNTDOWN
  |
  | Answer submitted or timeout
  v
ANSWER_RESULT
  |
  +---- Correct ----> QUESTION_COMPLETE
  |
  +---- Incorrect --> ELIMINATE_PLAYER
                           |
                           v
                    CHECK_REMAINING
                           |
             +-------------+-------------+
             |                           |
       Players remain              No players remain
             |                           |
             v                           v
        BUZZER_OPEN               QUESTION_COMPLETE
                                             |
                                             v
                                       NEXT_QUESTION
                                             |
                                             v
                                       GAME_COMPLETE
```

All state transitions must be controlled by the server.

Clients must never independently decide the authoritative game state.

## 7.3 Gameplay Sequence

### Step 1 — Display Question

The host advances to the next question.

The question and its possible answers appear on the host screen.

Example:

```text
------------------------------------------------
               QUESTION 3 / 10

        What is the capital of Norway?

       +----------------------------+
       | RED       | Oslo           |
       +----------------------------+
       | BLUE      | Bergen         |
       +----------------------------+
       | YELLOW    | Trondheim      |
       +----------------------------+
       | GREEN     | Stavanger      |
       +----------------------------+

                GET READY!
------------------------------------------------
```

The player screens display:

- Question number.
- Waiting status.
- Buzzer availability.

The question and answers may also be displayed on player devices, but the primary presentation is the host screen.

The host activates the buzzer.

### Step 2 — Activate Buzzer

When the buzzer becomes active, every eligible player sees a large buzzer button.

Example:

```text
+--------------------------------+
|                                |
|        QUESTION 3 / 10         |
|                                |
|                                |
|        +--------------+        |
|        |              |        |
|        |    BUZZ!     |        |
|        |              |        |
|        +--------------+        |
|                                |
|          SCORE: 4              |
|                                |
+--------------------------------+
```

The buzzer should:

- Occupy a large portion of the screen.
- Be easy to press with one hand.
- Provide immediate visual feedback.
- Be disabled when unavailable.
- Prevent duplicate submissions.

### Step 3 — Determine First Buzzer

When players press the buzzer:

1. The client sends a `buzzer:press` event.
2. The server validates player eligibility.
3. The server checks whether the buzzer is open.
4. The server atomically accepts the first valid press it processes.
5. The buzzer closes immediately.
6. The winning player is announced to all connected clients.

Example:

```text
ALEX BUZZED FIRST!
```

All devices must display the selected player's name.

If team mode is active, also display their team.

Example:

```text
ALEX
TEAM BLUE
```

### Buzzer Fairness

The server must be the single authority for determining the winner.

The first valid buzzer event processed by the server wins.

Do not use client-side timestamps to determine the winner.

This prevents players from manipulating their local device clocks.

The game should acknowledge buzzer submissions and ignore duplicate events.

The application should minimize latency, but exact fairness across devices with different network latency cannot be guaranteed.

### Step 4 — Answer Selection

The winning player receives an answer-selection interface.

Other players see:

```text
ALEX IS ANSWERING...
```

The host displays the player's name and the countdown.

### Answer Interface

Use four distinct colors inspired by popular multiplayer quiz games.

| Answer | Color | Shape |
|---|---|---|
| A | Red | Triangle |
| B | Blue | Diamond |
| C | Yellow | Circle |
| D | Green | Square |

The interface dynamically adjusts to questions containing two, three, or four answers.

Example:

```text
+--------------------------------+
|          YOUR TURN!            |
|                                |
|         TIME LEFT: 08          |
|                                |
| +------------+ +------------+  |
| |            | |            |  |
| | RED        | | BLUE       |  |
| | Oslo       | | Bergen     |  |
| |            | |            |  |
| +------------+ +------------+  |
|                                |
| +------------+ +------------+  |
| |            | |            |  |
| | YELLOW     | | GREEN      |  |
| | Trondheim  | | Stavanger  |  |
| |            | |            |  |
| +------------+ +------------+  |
|                                |
+--------------------------------+
```

### Countdown

The countdown starts when the server transitions to `ANSWER_COUNTDOWN`.

The server sends an authoritative deadline timestamp to clients.

Clients display the remaining time based on that deadline.

The server must reject answers received after the deadline.

### Answer Submission

The player selects one answer.

The client sends:

`answer:submit`

Payload:

```json
{
  "sessionId": "ABCD12",
  "questionId": "question-uuid",
  "answerId": "answer-1"
}
```

The server validates:

- Player identity.
- Active question.
- Current game state.
- Player eligibility.
- Answer availability.
- Countdown deadline.

Only the selected player may submit an answer.

Only one answer submission is accepted per attempt.

## 7.4 Correct Answer

If the selected answer is correct:

1. The server awards one point.
2. The answer is marked correct.
3. All devices receive the result.
4. The host screen flashes green.
5. The winning player sees a success screen.
6. Scores update.
7. The question is completed.

### Correct Answer Screen

```text
+--------------------------------+
|                                |
|                                |
|           CORRECT!             |
|                                |
|              +1                |
|                                |
|         WELL DONE, ALEX!       |
|                                |
|                                |
+--------------------------------+
```

Use:

- Green background.
- Large success text.
- Optional celebratory animation.
- Short success sound.

The host can then proceed to the next question.

## 7.5 Incorrect Answer

If the selected answer is incorrect:

1. The player receives zero points.
2. The host screen flashes red.
3. The player receives a red feedback screen.
4. The screen displays **DRINK 5**.
5. The incorrect answer is removed from the available answers.
6. The player becomes ineligible for the remainder of the question.
7. The game checks whether other eligible players remain.

### Incorrect Answer Screen

```text
+--------------------------------+
|                                |
|                                |
|             WRONG!             |
|                                |
|                                |
|            DRINK 5             |
|                                |
|                                |
|       YOU ARE ELIMINATED       |
|       FROM THIS QUESTION       |
|                                |
+--------------------------------+
```

The red screen should remain visible briefly before transitioning to the next state.

The drinking penalty is informational only and does not affect scoring.

### Removing Incorrect Answers

When an incorrect answer is selected:

- Mark the answer as eliminated.
- Remove it from future answer-selection screens for that question.
- Keep the remaining answers in their original order.
- Keep the remaining answers' original colors.
- Update the host display.

Example:

Original answers:

```text
RED       Oslo
BLUE      Bergen
YELLOW    Trondheim
GREEN     Stavanger
```

If Bergen is selected incorrectly:

```text
RED       Oslo
YELLOW    Trondheim
GREEN     Stavanger
```

The removed answer must not become selectable again during that question.

## 7.6 Reopening the Buzzer

If eligible players remain:

1. Display the incorrect result.
2. Update available answers.
3. Reset the buzzer state.
4. Exclude previously eliminated players.
5. Reopen the buzzer.
6. Allow remaining players to compete.

An eliminated player should see:

```text
YOU ARE OUT FOR THIS QUESTION

WAITING FOR NEXT QUESTION...
```

Eligible players receive a new buzzer opportunity.

### Important Rule

A player can attempt to answer a question only once.

Once eliminated, they cannot buzz again until the next question.

## 7.7 Last Remaining Answer

If all incorrect answers have been eliminated, only the correct answer remains.

The remaining eligible players can still compete to buzz first.

The first player to buzz receives the opportunity to select the remaining answer.

This preserves the intended buzzer mechanic.

Do not automatically award a point without a valid answer submission.

## 7.8 No Eligible Players Remaining

If all players have been eliminated:

- Close the buzzer.
- Mark the question as unresolved.
- Award no additional points.
- Display a message on the host screen.

Example:

```text
NO PLAYERS REMAINING

QUESTION COMPLETE

NEXT QUESTION
```

The host must be able to proceed manually.

## 7.9 Answer Timeout

If the selected player does not answer before the countdown expires:

1. The attempt is marked incorrect.
2. The player receives zero points.
3. The player is eliminated from the current question.
4. No answer option is removed.
5. Remaining eligible players may buzz again.

The timeout screen should use the incorrect-answer visual style.

Display:

```text
TIME'S UP!

DRINK 5
```

---

# 8. Team-Based Gameplay

## 8.1 Team Rules

When team mode is enabled:

- Each player belongs to one team.
- Each player has an individual score.
- Each team has a combined score.
- A correct answer awards one point to the player.
- The player's team receives one point through aggregation.

## 8.2 Team Elimination

Default behavior:

**Elimination applies to individual players, not entire teams.**

Example:

Team Blue contains:

- Alex
- Sarah
- John

If Alex answers incorrectly:

- Alex is eliminated from the current question.
- Sarah remains eligible.
- John remains eligible.

This avoids penalizing an entire team for one player's mistake.

## 8.3 Team Leaderboard

Team scores are calculated as:

```text
Team Score = SUM(Player Scores)
```

Example:

| Team | Score |
|---|---:|
| Blue | 12 |
| Red | 9 |
| Green | 7 |

Individual scores remain available.

---

# 9. Host Mode

## 9.1 Purpose

Host Mode provides the primary game presentation and controls.

It should resemble a modern multiplayer quiz-show interface.

The host interface must work well on a large screen or projector.

## 9.2 Host Dashboard

The host dashboard displays:

- Game title.
- Session code.
- Current question number.
- Total questions.
- Question text.
- Available answers.
- Current game state.
- Active player.
- Countdown.
- Connected player count.
- Leaderboard.
- Host controls.

## 9.3 Host Controls

Required controls:

| Control | Function |
|---|---|
| Start Game | Begin the session |
| Activate Buzzer | Open buzzer competition |
| Next Question | Advance to the next question |
| Show Leaderboard | Display scores |
| End Game | Finish the session |
| Return to Lobby | Return to the waiting lobby before starting |

Additional recommended controls:

- Pause Game.
- Resume Game.
- Restart Question.
- Reset Buzzer.
- Skip Question.

Administrative actions must require confirmation when they would discard progress or alter scores.

## 9.4 Host Screen Layout

Example:

```text
+------------------------------------------------------+
| WANNA GET DRUNK                   GAME CODE: ABCD12   |
+------------------------------------------------------+
|                                                      |
|                  QUESTION 3 / 10                     |
|                                                      |
|          What is the capital of Norway?              |
|                                                      |
|   +---------------------+  +---------------------+   |
|   | RED                 |  | BLUE                |   |
|   | Oslo                |  | Bergen              |   |
|   +---------------------+  +---------------------+   |
|                                                      |
|   +---------------------+  +---------------------+   |
|   | YELLOW              |  | GREEN               |   |
|   | Trondheim           |  | Stavanger           |   |
|   +---------------------+  +---------------------+   |
|                                                      |
|                 ALEX IS ANSWERING                    |
|                                                      |
|                      00:08                           |
|                                                      |
+------------------------------------------------------+
| [ACTIVATE BUZZER] [NEXT QUESTION] [LEADERBOARD]      |
+------------------------------------------------------+
```

## 9.5 Leaderboard

The host must be able to display the leaderboard between questions.

### Individual Leaderboard

```text
+--------------------------------+
|          LEADERBOARD           |
|                                |
|  1. Alex                  8    |
|  2. Sarah                 6    |
|  3. John                  5    |
|  4. Emma                  3    |
|                                |
+--------------------------------+
```

### Team Leaderboard

```text
+--------------------------------+
|        TEAM LEADERBOARD        |
|                                |
|  1. TEAM BLUE            14    |
|  2. TEAM RED             11    |
|  3. TEAM GREEN            8    |
|                                |
+--------------------------------+
```

Scores must be calculated from persistent records.

The host should be able to toggle between team and individual rankings.

---

# 10. User Interface Design

## 10.1 Visual Identity

The application should have a bold, playful, party-oriented visual identity.

### Design Direction

- Dark background.
- Bright accent colors.
- Large typography.
- Rounded buttons.
- High contrast.
- Smooth animations.
- Minimal distractions.
- Clear interaction states.

### Suggested Color Palette

| Purpose | Color | Hex |
|---|---|---|
| Background | Dark navy | `#101020` |
| Surface | Dark purple | `#202038` |
| Primary accent | Electric purple | `#8B5CF6` |
| Correct | Green | `#22C55E` |
| Incorrect | Red | `#EF4444` |
| Answer A | Red | `#EF4444` |
| Answer B | Blue | `#3B82F6` |
| Answer C | Yellow | `#EAB308` |
| Answer D | Green | `#22C55E` |
| Text | White | `#FFFFFF` |

## 10.2 Typography

Use a modern sans-serif font such as Inter.

Important game elements should use large, bold typography.

Recommended hierarchy:

- Game title: 48–64px.
- Host question: 36–48px.
- Answer labels: 24–32px.
- Player status: 24–36px.
- Countdown: 48–72px.

Sizes should scale responsively.

## 10.3 Mobile Experience

The mobile interface must prioritize touch interaction.

Requirements:

- Large touch targets.
- Minimal scrolling during gameplay.
- Full-width buttons.
- Portrait orientation support.
- Responsive layouts.
- Clear disabled states.
- Fast interaction feedback.
- Accessible contrast.
- Reduced-motion support.

Do not require players to install an application.

The game must work in a mobile browser.

## 10.4 Animations

Recommended animations:

**Buzzer activated**
- Buzzer pulses briefly.
- Button becomes visually active.

**Buzzer winner**
- Winning player name appears prominently.
- Short transition animation.

**Correct answer**
- Green flash.
- Score increment animation.

**Incorrect answer**
- Red flash.
- Incorrect answer disappears.

**Countdown**
- Progress indicator.
- More prominent warning during the final three seconds.

Animations must not block server-side state transitions.

---

# 11. Database Design

Use SQLite with Prisma.

## 11.1 Core Entities

The database must contain the following entities.

### GameTemplate

Stores reusable game configurations.

Fields:

```text
id
name
description
teamMode
maxTeams
createdAt
updatedAt
```

### Question

Stores questions belonging to a game template.

Fields:

```text
id
gameTemplateId
text
displayOrder
countdownSeconds
createdAt
updatedAt
```

### Answer

Stores answer options.

Fields:

```text
id
questionId
text
displayOrder
isCorrect
```

### GameSession

Represents an actual game being played.

Fields:

```text
id
gameTemplateId
sessionCode
status
currentQuestionIndex
createdAt
startedAt
endedAt
```

### Player

Stores player identities for a specific session.

Fields:

```text
id
gameSessionId
displayName
teamId
reconnectTokenHash
connected
joinedAt
lastSeenAt
```

### Team

Stores session teams.

Fields:

```text
id
gameSessionId
name
color
createdAt
```

### QuestionAttempt

Stores each player's attempt to answer a question.

Fields:

```text
id
gameSessionId
questionId
playerId
selectedAnswerId
isCorrect
timedOut
pointsAwarded
attemptedAt
```

`selectedAnswerId` must be nullable to support timeouts.

### ScoreEvent

Stores point-awarding events.

Fields:

```text
id
gameSessionId
playerId
questionId
questionAttemptId
points
createdAt
```

Each successful question attempt must produce at most one score event.

Use a unique constraint on `questionAttemptId`.

## 11.2 Database Relationships

```text
GameTemplate
    |
    +---- Question
    |         |
    |         +---- Answer
    |
    +---- GameSession
               |
               +---- Player
               |
               +---- Team
               |
               +---- QuestionAttempt
               |
               +---- ScoreEvent
```

## 11.3 Score Persistence

Scores must be persisted immediately after a correct answer.

Do not rely exclusively on in-memory scores.

Individual scores are calculated as:

```sql
SELECT
    playerId,
    SUM(points) AS totalScore
FROM ScoreEvent
WHERE gameSessionId = ?
GROUP BY playerId;
```

Team scores are calculated by joining score events with players and teams.

Use database transactions to ensure that recording a correct attempt and awarding its point happen atomically.

## 11.4 Game State Persistence

The authoritative live game state should be managed by the server.

Persist sufficient information to recover active sessions after a server restart.

Store:

- Current question.
- Current phase.
- Eliminated players.
- Eliminated answers.
- Current selected player.
- Countdown deadline.
- Session status.

Use a dedicated `SessionState` table or equivalent normalized tables.

For each session, only one authoritative game-state engine may process state-changing events.

After restarting the server:

1. Load active sessions from SQLite.
2. Reconstruct their state.
3. Pause sessions that were in progress.
4. Wait for the host to resume.
5. Reconnect players using their existing identities.

Expired countdowns must not silently award or deduct points during recovery.

---

# 12. Real-Time Communication

## 12.1 Socket.IO Rooms

Each game session should have its own Socket.IO room.

Example:

```text
game:ABCD12
```

Players join the corresponding room after successful authentication.

Use additional private rooms for individual players.

Example:

```text
player:PLAYER_ID
```

Private answer-selection events must be sent only to the selected player.

## 12.2 Socket Events

### Client to Server

| Event | Description |
|---|---|
| `session:join` | Join an existing session |
| `session:reconnect` | Restore player connection |
| `buzzer:press` | Submit buzzer press |
| `answer:submit` | Submit selected answer |
| `host:start` | Start game |
| `host:activateBuzzer` | Activate buzzer |
| `host:nextQuestion` | Advance question |
| `host:pause` | Pause gameplay |
| `host:resume` | Resume gameplay |
| `host:end` | End game |

### Server to Client

| Event | Description |
|---|---|
| `session:state` | Current public game state |
| `players:updated` | Updated player list |
| `game:started` | Game has started |
| `question:display` | Display current question |
| `buzzer:opened` | Buzzer becomes active |
| `buzzer:winner` | Announce winning player |
| `answer:turn` | Notify selected player |
| `answer:result` | Announce answer result |
| `answer:removed` | Remove incorrect answer |
| `score:updated` | Updated scores |
| `question:complete` | Question completed |
| `game:completed` | Game finished |
| `game:paused` | Game paused |

## 12.3 Real-Time Security

The server must validate every state-changing event.

Never trust:

- Client-provided scores.
- Client-provided correctness flags.
- Client-provided timestamps.
- Client-provided player identities.
- Client-provided eligibility.
- Client-provided game states.

The server must derive these values from authenticated sessions and authoritative state.

### Important Security Rule

**Correct-answer information must never be included in public question payloads before the question is resolved.**

Players must not be able to inspect network messages to discover correct answers.

Correctness must be evaluated server-side.

---

# 13. API Design

Use Next.js Route Handlers for configuration and administrative operations.

## 13.1 Game Templates

```http
GET    /api/games
POST   /api/games
GET    /api/games/:id
PUT    /api/games/:id
DELETE /api/games/:id
```

## 13.2 Questions

```http
GET    /api/games/:id/questions
POST   /api/games/:id/questions
PUT    /api/questions/:id
DELETE /api/questions/:id
```

## 13.3 Import and Export

```http
GET  /api/games/:id/export
POST /api/games/import
```

## 13.4 Sessions

```http
POST /api/sessions
GET  /api/sessions/:code
POST /api/sessions/:code/join
GET  /api/sessions/:code/leaderboard
```

## 13.5 API Requirements

All endpoints must:

- Validate input using Zod.
- Return consistent JSON responses.
- Handle errors gracefully.
- Use appropriate HTTP status codes.
- Enforce host permissions where required.
- Avoid exposing sensitive player information.

---

# 14. Routing

Use the following application routes.

| Route | Purpose |
|---|---|
| `/` | Home page |
| `/setup` | Game template management |
| `/setup/new` | Create game |
| `/setup/:id` | Edit game |
| `/host` | Host dashboard |
| `/host/:sessionCode` | Active host session |
| `/game/:sessionCode` | Player join and game interface |
| `/results/:sessionCode` | Final results |

## 14.1 Home Page

The home page should provide three primary actions:

```text
+--------------------------------+
|                                |
|        WANNA GET DRUNK         |
|                                |
|       THE ULTIMATE PARTY       |
|          BUZZER GAME           |
|                                |
|      [ CREATE A GAME ]         |
|                                |
|      [ HOST A GAME ]           |
|                                |
|      [ JOIN A GAME ]           |
|                                |
+--------------------------------+
```

The host should be able to create a new game or select an existing configuration.

---

# 15. Local Deployment

## 15.1 Requirements

The application must run on a local computer.

Required software:

- Node.js LTS.
- npm.
- A modern browser.

No separate database server is required.

## 15.2 Development Startup

The application should support:

```bash
npm install
npm run dev
```

The development server should be accessible at:

`http://localhost:3000`

## 15.3 Production Startup

Provide scripts for:

```bash
npm run build
npm run start
```

The application must bind to a configurable network interface.

For local-network hosting, use:

`0.0.0.0`

The server should print its available local-network URL when starting.

Example:

```text
WannaGetDrunk is running!

Local:
http://localhost:3000

Network:
http://192.168.1.100:3000
```

The network address must be detected from the host computer rather than hardcoded.

## 15.4 Local Network Access

Players must connect to the same local network as the host.

Example:

```text
Host laptop:
192.168.1.100

Player 1:
192.168.1.101

Player 2:
192.168.1.102
```

Players join through:

`http://192.168.1.100:3000/game/ABCD12`

The host computer must allow inbound connections to the configured application port.

The application must work without an external internet connection once dependencies have been installed and the application has been built.

Avoid runtime dependencies on:

- Cloud databases.
- External authentication providers.
- Remote font services.
- Third-party real-time services.
- External asset CDNs.

All required frontend assets should be served locally.

## 15.5 SQLite Storage

Store persistent application data in:

```text
/data/wannagetdrunk.db
```

Enable SQLite WAL mode to improve concurrent read/write behavior.

Use Prisma migrations to manage schema changes.

The database file must not be overwritten during application upgrades.

Include the database directory in `.gitignore`.

---

# 16. Project Structure

Recommended structure:

```text
wannagetdrunk/
│
├── app/
│   ├── page.tsx
│   │
│   ├── setup/
│   │   ├── page.tsx
│   │   ├── new/
│   │   │   └── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   │
│   ├── host/
│   │   ├── page.tsx
│   │   └── [sessionCode]/
│   │       └── page.tsx
│   │
│   ├── game/
│   │   └── [sessionCode]/
│   │       └── page.tsx
│   │
│   ├── results/
│   │   └── [sessionCode]/
│   │       └── page.tsx
│   │
│   └── api/
│       ├── games/
│       └── sessions/
│
├── components/
│   ├── ui/
│   ├── game/
│   │   ├── Buzzer.tsx
│   │   ├── AnswerGrid.tsx
│   │   ├── Countdown.tsx
│   │   ├── QuestionDisplay.tsx
│   │   ├── Leaderboard.tsx
│   │   └── ResultScreen.tsx
│   │
│   ├── host/
│   │   ├── HostControls.tsx
│   │   ├── HostDashboard.tsx
│   │   └── PlayerList.tsx
│   │
│   └── setup/
│       ├── GameEditor.tsx
│       ├── QuestionEditor.tsx
│       └── AnswerEditor.tsx
│
├── lib/
│   ├── db.ts
│   ├── socket.ts
│   ├── validation.ts
│   └── utils.ts
│
├── server/
│   ├── index.ts
│   ├── socket/
│   │   ├── handlers.ts
│   │   └── rooms.ts
│   │
│   └── game/
│       ├── GameEngine.ts
│       ├── GameState.ts
│       ├── BuzzerManager.ts
│       ├── AnswerManager.ts
│       └── ScoreManager.ts
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── data/
│   └── wannagetdrunk.db
│
├── public/
│   ├── sounds/
│   └── images/
│
├── types/
│   ├── game.ts
│   ├── player.ts
│   └── socket.ts
│
├── tests/
│   ├── unit/
│   └── integration/
│
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── .env.example
└── README.md
```

The custom Node.js server must serve both Next.js and Socket.IO through the same HTTP server.

---

# 17. Game Engine Requirements

## 17.1 Centralized Game Engine

Implement a dedicated server-side `GameEngine`.

It must handle:

- Session lifecycle.
- Question progression.
- Buzzer eligibility.
- Buzzer winner selection.
- Answer validation.
- Countdown expiration.
- Player elimination.
- Answer elimination.
- Score updates.
- Game completion.
- State persistence.

The frontend must never directly modify the authoritative game state.

## 17.2 State Transition Validation

Every action must be checked against the current state.

Examples:

- A buzzer press is invalid while the buzzer is closed.
- An eliminated player cannot buzz.
- A player cannot answer unless selected.
- A player cannot submit an eliminated answer.
- A question cannot advance during an active answer countdown without an explicit host override.
- A completed question cannot award additional points.

## 17.3 Concurrency

The game engine must handle simultaneous events safely.

For buzzer presses:

- Process events through a single serialized state transition path per session.
- Accept only the first valid event.
- Close the buzzer before processing subsequent presses.
- Broadcast the winning player.

For answer submissions:

- Accept only one submission per attempt.
- Reject late submissions.
- Prevent duplicate score awards.
- Use idempotency protection for retries.

## 17.4 Timer Management

Timers must be managed by the server.

Use authoritative deadline timestamps.

The frontend should display countdown animations but must not determine whether an answer was submitted in time.

The server must handle:

- Player disconnections.
- Browser refreshes.
- Delayed events.
- Timer expiration.
- Host pause/resume actions.

---

# 18. Error Handling

## 18.1 Player Disconnects

If a player disconnects:

- Mark the player as disconnected.
- Preserve their score.
- Preserve their team.
- Allow reconnection.

If the player currently has the answer turn, the countdown continues.

If the countdown expires, apply the normal timeout rules.

## 18.2 Host Disconnects

If the host disconnects:

- Pause the game.
- Preserve the current game state.
- Inform players that the host disconnected.
- Allow the host to reconnect.
- Resume only when the host explicitly chooses to continue.

## 18.3 Invalid Session

If a player enters an invalid game code, display:

```text
GAME NOT FOUND

Check your game code and try again.
```

## 18.4 Game Already Started

If a new player attempts to join after registration closes, display:

```text
GAME ALREADY STARTED

New players cannot join this session.
```

Previously registered players must still be able to reconnect.

## 18.5 Duplicate Player Name

Display:

```text
NAME ALREADY TAKEN

Please choose another name.
```

---

# 19. Security Requirements

Although primarily intended for local use, the application must implement basic security measures.

Requirements:

- Validate all incoming data.
- Sanitize and safely render user-generated text.
- Prevent unauthorized host actions.
- Prevent players from modifying scores.
- Prevent players from submitting answers for others.
- Protect reconnect tokens.
- Prevent access to correct answers before resolution.
- Use cryptographically secure session identifiers.
- Rate-limit buzzer and registration requests.
- Validate imported JSON.
- Enforce reasonable input-size limits.

## 19.1 Host Authentication

When creating a game session, generate a secure host token.

Store the host token in an HTTP-only cookie.

Only authenticated host requests may:

- Start games.
- Advance questions.
- Activate buzzers.
- Pause sessions.
- End games.
- Modify game state.

Do not treat possession of a session code as host authorization.

For a local-first application, full user-account authentication is not required for the initial version.

## 19.2 Player Authentication

Generate an unguessable reconnect token when a player registers.

Store only a secure hash of the token in SQLite.

Validate the token when the player reconnects.

Bind the authenticated Socket.IO connection to the player's server-side identity.

Do not trust a `playerId` supplied in a socket event as proof of identity.

---

# 20. Testing Requirements

## 20.1 Unit Tests

Test:

- Question validation.
- Answer validation.
- Correct-answer detection.
- Score calculation.
- Team score aggregation.
- Player elimination.
- Answer elimination.
- Countdown expiration.
- Game-state transitions.

## 20.2 Multiplayer Integration Tests

Test the following scenarios.

### Scenario 1 — First Buzzer Wins

Given three connected players:

1. Open the buzzer.
2. Simulate near-simultaneous buzzer presses.
3. Verify exactly one winner.
4. Verify all other presses are rejected.

### Scenario 2 — Correct Answer

1. Player wins the buzzer.
2. Player selects the correct answer.
3. Verify one point is awarded.
4. Verify the question completes.
5. Verify the score is stored in SQLite.

### Scenario 3 — Incorrect Answer

1. Player wins the buzzer.
2. Player selects an incorrect answer.
3. Verify zero points.
4. Verify the player is eliminated.
5. Verify the incorrect answer is removed.
6. Verify the buzzer reopens for eligible players.

### Scenario 4 — Multiple Incorrect Answers

1. Player A selects an incorrect answer.
2. Player B selects another incorrect answer.
3. Player C wins the next buzzer.
4. Verify only remaining answers are available.
5. Verify Player C can score.

### Scenario 5 — Timeout

1. Player wins the buzzer.
2. Player does not answer.
3. Countdown expires.
4. Verify player elimination.
5. Verify no answer is removed.
6. Verify the buzzer can reopen.

### Scenario 6 — Reconnection

1. Player joins.
2. Player scores a point.
3. Player disconnects.
4. Player reconnects.
5. Verify identity and score are preserved.

### Scenario 7 — Server Restart

1. Start a game.
2. Complete several questions.
3. Restart the application.
4. Verify scores and session state are restored.
5. Verify the host can resume gameplay.

### Scenario 8 — Team Scoring

1. Create multiple teams.
2. Assign players to teams.
3. Award points to individual players.
4. Verify team scores equal the sum of member scores.

---

# 21. Development Phases

## Phase 1 — Foundation

Implement:

- Next.js project.
- TypeScript.
- Tailwind CSS.
- SQLite.
- Prisma.
- Database schema.
- Application routing.
- Basic layouts.

**Deliverable:** A locally running application with persistent storage.

## Phase 2 — Game Setup

Implement:

- Game creation.
- Game editing.
- Question management.
- Answer management.
- Countdown configuration.
- Team configuration.
- JSON import/export.

**Deliverable:** Hosts can create and save complete games.

## Phase 3 — Player Registration

Implement:

- Session creation.
- Unique session codes.
- Player registration.
- Team selection.
- Player lobby.
- QR-code generation.
- Reconnection tokens.

**Deliverable:** Multiple mobile devices can join the same session.

## Phase 4 — Real-Time Game Engine

Implement:

- Socket.IO.
- Game-state machine.
- Question progression.
- Buzzer functionality.
- First-buzzer selection.
- Answer selection.
- Countdown handling.
- Answer elimination.
- Player elimination.
- Scoring.

**Deliverable:** Complete multiplayer gameplay.

## Phase 5 — Host Interface

Implement:

- Host dashboard.
- Question presentation.
- Answer presentation.
- Buzzer winner announcements.
- Countdown.
- Game controls.
- Leaderboards.

**Deliverable:** Full host-controlled gameplay.

## Phase 6 — Visual Polish

Implement:

- Mobile optimization.
- Animations.
- Sound effects.
- Correct/incorrect feedback.
- Improved typography.
- Responsive layouts.

**Deliverable:** A polished game-show experience.

## Phase 7 — Testing and Reliability

Implement:

- Unit tests.
- Integration tests.
- Multiplayer concurrency tests.
- Reconnection tests.
- Database persistence tests.
- Error handling.
- Local deployment documentation.

**Deliverable:** A stable, locally deployable application.

---

# 22. Minimum Viable Product

The first functional release must support:

- Creating and saving quiz games.
- Configuring questions with 2–4 answers.
- Configuring countdowns.
- Importing and exporting games.
- Creating a multiplayer session.
- Joining through a mobile browser.
- Choosing a player name.
- Optional team assignment.
- Displaying questions on the host screen.
- Activating a buzzer.
- Determining the first valid buzzer press.
- Allowing the selected player to answer.
- Displaying correct and incorrect feedback.
- Eliminating players after incorrect answers.
- Removing incorrect answer options.
- Reopening the buzzer.
- Awarding points.
- Displaying leaderboards.
- Persisting results in SQLite.
- Reconnecting disconnected players.
- Running locally over a LAN.

The initial release does not require:

- Public internet hosting.
- User accounts.
- Cloud synchronization.
- Native mobile applications.
- Payment functionality.
- AI-generated questions.
- Online matchmaking.

---

# 23. Acceptance Criteria

The application is considered complete when all the following conditions are satisfied.

### Setup

- A host can create a game containing multiple questions.
- Each question supports 2–4 answers.
- Exactly one answer can be marked correct.
- Countdown duration can be configured.
- Games persist after server restarts.
- Games can be imported and exported.

### Multiplayer

- Multiple players can join from separate mobile devices.
- Players see lobby updates in real time.
- Player names are unique within each session.
- Players can reconnect without losing their scores.

### Gameplay

- The host can start the game.
- Questions appear on the host screen.
- Players can buzz from their smartphones.
- Only one player wins each buzzer round.
- The selected player can answer.
- Correct answers award exactly one point.
- Incorrect answers award zero points.
- Incorrect answers trigger a red **DRINK 5** screen.
- Incorrect answers are removed from the current question.
- Incorrect players cannot buzz again during that question.
- Remaining players can continue buzzing.
- Timeouts eliminate the selected player.
- The host can advance when no players remain.
- The host can complete the entire quiz.

### Scoring

- Individual scores are accurate.
- Team scores are accurate.
- Scores persist in SQLite.
- Duplicate events cannot award duplicate points.
- Final rankings are displayed correctly.

### Local Operation

- The application starts using documented commands.
- The host can access the application locally.
- Players can connect over the same local network.
- Gameplay does not require internet access.
- No external database is required.
- The application can recover persisted game data after restarting.

---

# 24. Future Enhancements

Potential features for later versions:

### Custom Drinking Penalties

Allow the host to configure the penalty text.

Examples:

- DRINK 2
- DRINK 5
- TAKE A SIP
- CHOOSE SOMEONE TO DRINK

The penalty is displayed as a game prompt rather than enforced by the application.

### Sound Effects

Add configurable sounds for:

- Buzzer activation.
- Buzzer winner.
- Correct answer.
- Incorrect answer.
- Countdown expiration.

### Game Themes

Allow hosts to select different visual themes.

### Question Categories

Organize questions into categories.

### Question Randomization

Randomize question and answer order while preserving correctness.

### Historical Statistics

Track:

- Games played.
- Total points earned.
- Correct answers.
- Incorrect answers.
- Fastest buzzer responses.
- Team victories.

### Progressive Web App

Add optional PWA functionality so players can install the interface on their home screens.

### Docker Deployment

Provide Docker support for simplified self-hosting.

---

# 25. Implementation Guidelines

The development process must follow these principles:

1. Use TypeScript throughout the application.
2. Keep game logic separate from UI components.
3. Use Prisma for SQLite database operations.
4. Use Socket.IO for real-time gameplay.
5. Treat the server as the authoritative source of truth.
6. Persist critical game-state changes.
7. Validate all user inputs.
8. Design mobile interfaces first.
9. Keep host controls simple and intuitive.
10. Ensure games can run entirely on a local network.
11. Write automated tests for critical gameplay logic.
12. Avoid unnecessary external services.
13. Keep the architecture maintainable and modular.
14. Prioritize reliable multiplayer synchronization over decorative animations.

---

# 26. Final Development Objective

Build a complete, locally hosted multiplayer web application named **WannaGetDrunk**.

The application must combine:

- A reusable quiz editor.
- Persistent SQLite storage.
- Mobile player registration.
- Optional team-based competition.
- A real-time buzzer system.
- Multiple-choice questions.
- Countdown-based answering.
- Player elimination.
- Incorrect-answer elimination.
- Drinking penalty feedback.
- Persistent scoring.
- A visually engaging host interface.
- Live leaderboards.

The final product should feel like a combination of a **real-time buzzer competition** and a **colorful multiplayer quiz game**, optimized for social gatherings.

**The primary objective is to deliver a responsive, reliable, entertaining multiplayer experience that works entirely on a locally hosted web server.**