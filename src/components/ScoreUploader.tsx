import { db } from '../firebase/client';
import { updateDoc, doc, arrayUnion } from 'firebase/firestore/lite';
import { useEffect, useState } from 'react';
import { UploaderProps, Score } from '../types.d';
import { Link, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

const ScoreUploader = ({ username, timer }: UploaderProps) => {
  const { id } = useParams<string>();
  const [score, setScore] = useState<Score>({
    user: username.split(' ')[0],
    time: 0,
    id: uuidv4(),
  });

  // Update score time when timer state changes to prevent .1s discrepancy
  useEffect(() => {
    const tempScore = { ...score };
    tempScore.time = timer;
    setScore(tempScore);
  }, [timer]);

  const uploadScore = async () => {
    try {
      await updateDoc(doc(db, 'leaderboards', `${id}`), {
        scores: arrayUnion(score),
      });
      window.location.href = `/leaderboards/${id}`;
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div id="uploader-container">
      <div id="score-uploader">
        <div>You finished the puzzle in {timer} seconds!</div>
        <Link to="" onClick={uploadScore}>
          Add to Leaderboard
        </Link>
        <button onClick={() => window.location.reload()}>Play Again</button>
        <Link to="/puzzles">Home</Link>
      </div>
    </div>
  );
};

export default ScoreUploader;
