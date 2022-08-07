import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore/lite';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { db } from '../firebase/client';
import { LeaderboardData } from '../types.d';
import Leaderboard from './Leaderboard';

const LeaderboardPage = () => {
  const { id } = useParams<string>();
  const [leaderboard, setLeaderboard] = useState<LeaderboardData>();

  const storage = getStorage();

  useEffect(() => {
    const getLeaderboard = async () => {
      try {
        const results = await getDoc(doc(db, 'leaderboards', `${id}`));
        let data = results.data() as LeaderboardData;
        const url = await getDownloadURL(ref(storage, data.image));
        data.image = url;
        setLeaderboard(data);
      } catch (err) {
        console.error(err);
      }
    };
    getLeaderboard();
  }, []);

  return (
    <section id="leaderboard-page">
      <div className="puzzle-info">
        <div className="text-info">
          <h2>{leaderboard?.title}</h2>
          <p className="author">
            Created by {leaderboard?.author.split(' ')[0]} on{' '}
            {leaderboard?.timestamp.toDate().toLocaleDateString()}
          </p>
          <Link className="play-link" to={`/puzzles/${id}`}>
            Play Puzzle
          </Link>
        </div>
        <Link className="image-link" to={`/puzzles/${id}`}>
          {' '}
          <img src={leaderboard?.image} alt="puzzle thumbnail" />
        </Link>
      </div>
      {leaderboard && <Leaderboard scores={leaderboard.scores} />}
    </section>
  );
};

export default LeaderboardPage;
