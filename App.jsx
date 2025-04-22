import { useState, useEffect } from "react";

function formatPoint(value) {
  const scale = ["0", "15", "30", "40", "AD"];
  return value < scale.length ? scale[value] : value;
}

export default function App() {
  const [player1, setPlayer1] = useState("");
  const [player2, setPlayer2] = useState("");
  const [matchStarted, setMatchStarted] = useState(false);
  const [matchId, setMatchId] = useState("");
  const [score, setScore] = useState({ sets: [[0, 0]], game: [0, 0], history: [], status: "in_progress" });
  const [exportedJson, setExportedJson] = useState(null);

  const handleStartMatch = async () => {
    if (!player1 || !player2) return alert("Введите имена игроков");
    const res = await fetch("http://localhost:8000/match/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ players: [player1, player2] }),
    });
    const data = await res.json();
    setMatchId(data.match_id);
    setMatchStarted(true);
  };

  const handleAddPoint = async (playerIndex) => {
    await fetch("http://localhost:8000/match/point", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ match_id: matchId, player: playerIndex }),
    });
    fetchMatchState();
  };

  const handleUndo = async () => {
    await fetch("http://localhost:8000/match/undo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ match_id: matchId }),
    });
    fetchMatchState();
  };

  const handleEndMatch = async () => {
    await fetch("http://localhost:8000/match/end", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ match_id: matchId }),
    });
    fetchMatchState();
  };

  const handleExportMatch = async () => {
    const res = await fetch(`http://localhost:8000/match/${matchId}/export`);
    const data = await res.json();
    setExportedJson(data);
  };

  const fetchMatchState = async () => {
    const res = await fetch(`http://localhost:8000/match/${matchId}`);
    const data = await res.json();
    setScore({
      sets: data.sets,
      game: data.game_score,
      history: data.history,
      status: data.status ?? "in_progress"
    });
  };

  useEffect(() => {
    if (matchStarted) {
      const interval = setInterval(fetchMatchState, 2000);
      return () => clearInterval(interval);
    }
  }, [matchStarted, matchId]);

  if (!matchStarted) {
    return (
      <div style={{ padding: 20 }}>
        <input placeholder="Игрок 1" value={player1} onChange={(e) => setPlayer1(e.target.value)} />
        <input placeholder="Игрок 2" value={player2} onChange={(e) => setPlayer2(e.target.value)} />
        <button onClick={handleStartMatch}>Начать матч</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Счёт по сетам</h2>
      <table border="1">
        <thead>
          <tr>
            <th></th>
            {score.sets.map((_, i) => <th key={i}>Сет {i + 1}</th>)}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{player1}</td>
            {score.sets.map((set, i) => <td key={i}>{set[0]}</td>)}
          </tr>
          <tr>
            <td>{player2}</td>
            {score.sets.map((set, i) => <td key={i}>{set[1]}</td>)}
          </tr>
        </tbody>
      </table>

      <h3>Текущий гейм</h3>
      <p>{player1}: {formatPoint(score.game[0])} — {player2}: {formatPoint(score.game[1])}</p>

      <button onClick={() => handleAddPoint(0)}>{player1} +1</button>
      <button onClick={() => handleAddPoint(1)}>{player2} +1</button>
      <button onClick={handleUndo}>Отменить</button>
      <button onClick={handleEndMatch}>Завершить матч</button>
      <button onClick={handleExportMatch}>Экспорт JSON</button>

      {score.status === "completed" && <p style={{ color: "red" }}>Матч завершён</p>}

      <pre>{exportedJson && JSON.stringify(exportedJson, null, 2)}</pre>
    </div>
  );
}
