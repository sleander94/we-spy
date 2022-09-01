import { useState, useEffect } from 'react';
import {
  doc,
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  updateDoc,
  increment,
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
            const url = await getDownloadURL(
              ref(storage, `puzzles/thumb_${puzzle.image}`)
            );
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

  // Delete puzzle, leaderboard, and puzzle image, and thumbnail from firebase
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);
  const [delId, setDelId] = useState<string>('');

  const getDelConfirmation = (id: string, image: string) => {
    setDelId(id);
    setConfirmDelete(true);
  };

  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const deletePuzzle = async () => {
    try {
      setConfirmDelete(false);
      setIsDeleting(true);
      await deleteDoc(doc(db, 'puzzles', delId));
      await deleteDoc(doc(db, 'leaderboards', delId));
      await deleteObject(ref(storage, `puzzles/${delId}`));
      await deleteObject(ref(storage, `puzzles/thumb_${delId}`));
      await updateDoc(doc(db, 'puzzle-total', 'total'), {
        count: increment(-1),
      });
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <section id="user-puzzles">
      {loggedIn && (
        <div id="page-container">
          {loading && (
            <div className="loading-container">
              <div className="rect1"></div>
              <div className="rect2"></div>
              <div className="rect3"></div>
            </div>
          )}
          {isDeleting && (
            <div className="loading-container">
              <div className="rect1"></div>
              <div className="rect2"></div>
              <div className="rect3"></div>
            </div>
          )}
          {confirmDelete && (
            <div className="deleting-container">
              <div className="confirm-delete">
                <p>Are you sure you want to permantely delete this puzzle?</p>
                <div className="delete-buttons">
                  <button
                    className="cancel"
                    onClick={() => setConfirmDelete(false)}
                  >
                    Cancel
                  </button>
                  <button className="delete" onClick={() => deletePuzzle()}>
                    Confirm Delete
                  </button>
                </div>
              </div>
            </div>
          )}
          {!loading && !isDeleting && (
            <div id="puzzle-container">
              <h1>My Puzzles</h1>
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
                        className="delete-puzzle"
                        onClick={() =>
                          getDelConfirmation(puzzle.id, puzzle.image)
                        }
                      >
                        Delete Puzzle
                      </button>
                    </div>
                  );
                })}
              </div>
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
