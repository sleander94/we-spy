import { useEffect, useState } from 'react';
import { LeaderboardProps, Score } from '../types.d';

const Leaderboard = ({ scores }: LeaderboardProps) => {
  const [sortedScores, setSortedScores] = useState<Array<Score>>();

  // Sort scores by time in ascending order
  useEffect(() => {
    const compareTime = (a: Score, b: Score) => {
      if (a.time < b.time) {
        return -1;
      }
      if (a.time > b.time) {
        return 1;
      }
      return 0;
    };
    setSortedScores(scores.sort(compareTime));
  }, [scores]);

  return (
    <section id="leaderboard">
      <h1>Top Scores</h1>
      <div className="headers">
        <h2>Rank</h2>
        <h2>Name</h2>
        <h2>Time</h2>
      </div>
      {sortedScores?.map((score) => {
        return (
          <div className="score" key={score.id}>
            <p>{scores.indexOf(score) + 1}</p>
            <p>{score.user}</p>
            <p>{score.time}</p>
          </div>
        );
      })}
    </section>
  );
};

export default Leaderboard;
