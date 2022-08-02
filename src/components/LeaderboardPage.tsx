import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore/lite';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { db } from '../firebase/client';
import { LeaderboardData } from '../types.d';
import PuzzleCard from './PuzzleCard';
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
      <h1>Leaderboard</h1>
      {leaderboard && id && (
        <PuzzleCard
          id={id}
          title={leaderboard.title}
          author={leaderboard.author}
          image={leaderboard.image}
          timestamp={leaderboard.timestamp}
        />
      )}
      {leaderboard && <Leaderboard scores={leaderboard.scores} />}
    </section>
  );
};

export default LeaderboardPage;
