import { useState, useEffect } from 'react';
import {
  doc,
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
} from 'firebase/firestore/lite';
import {
  getStorage,
  ref,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db } from '../firebase/client';
import { Puzzle } from '../types.d';
import PuzzleCard from './PuzzleCard';
import { UserProps } from '../types.d';

const UserPuzzles = ({ username, userId, loggedIn }: UserProps) => {
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const storage = getStorage();

  // Get all puzzles from firestore & their image URLS from storage before setting state
  useEffect(() => {
    const getPuzzles = async () => {
      try {
        // Wait for userId before sending query
        if (userId !== '') {
          const results = await getDocs(
            query(collection(db, 'puzzles'), where('authorId', '==', userId))
          );
          let data: Array<Puzzle> = [];
          results.forEach((puzzle) => {
            let info = puzzle.data();
            info.id = puzzle.id;
            data.push(info as Puzzle);
          });
          for (const puzzle of data) {
            const url = await getDownloadURL(ref(storage, puzzle.image));
            puzzle.image = url;
          }
          setPuzzles(data);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
      }
    };
    getPuzzles();
  }, [userId]);

  // Delete puzzle, leaderboard, and puzzle image from firebase
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const deletePuzzle = async (id: string, image: string) => {
    try {
      setIsDeleting(true);
      await deleteDoc(doc(db, 'puzzles', id));
      await deleteDoc(doc(db, 'leaderboards', id));
      await deleteObject(ref(storage, image));
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <section id="user-puzzles">
      {loggedIn && (
        <div id="puzzle-container">
          <h1>My Puzzles</h1>
          {loading && (
            <div className="loading-container">
              <div className="animation">Loading My Puzzles...</div>
            </div>
          )}
          {isDeleting && (
            <div className="deleting-container">
              <div className="animation">Deleting Puzzle...</div>
            </div>
          )}
          {!loading && (
            <div className="puzzle-grid">
              {puzzles.map((puzzle: Puzzle) => {
                return (
                  <div key={puzzle.id} className="user-puzzle">
                    <PuzzleCard
                      id={puzzle.id}
                      title={puzzle.title}
                      author={puzzle.author}
                      image={puzzle.image}
                      timestamp={puzzle.timestamp}
                      likes={puzzle.likes}
                      views={puzzle.views}
                    />
                    <button
                      onClick={() => deletePuzzle(puzzle.id, puzzle.image)}
                    >
                      Delete Puzzle
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {!loggedIn && (
        <div id="login-prompt">
          <h1>You need to log in to view your puzzles.</h1>
        </div>
      )}
    </section>
  );
};

export default UserPuzzles;
