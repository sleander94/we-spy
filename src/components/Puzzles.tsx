import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore/lite';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { db } from '../firebase/client';
import { Puzzle } from '../types.d';
import PuzzleCard from './PuzzleCard';

const Puzzles = () => {
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const storage = getStorage();

  // Get all puzzles from firestore & their image URLS from storage before setting state
  useEffect(() => {
    const getPuzzles = async () => {
      try {
        const results = await getDocs(
          query(collection(db, 'puzzles'), orderBy('views', 'desc'))
        );
        let data: Puzzle[] = [];
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
      } catch (err) {
        console.error(err);
      }
    };
    getPuzzles();
  }, []);

  const sortPuzzles = async (order: string) => {
    try {
      setLoading(true);
      const results = await getDocs(
        query(collection(db, 'puzzles'), orderBy(order, 'desc'))
      );
      let data: Puzzle[] = [];
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
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <section id="puzzles">
      {loading && (
        <div className="loading-container">
          <div className="rect1"></div>
          <div className="rect2"></div>
          <div className="rect3"></div>
        </div>
      )}
      {!loading && (
        <div id="puzzle-container">
          <h1>Puzzles</h1>
          <div className="sort-buttons">
            <button onClick={() => sortPuzzles('views')}>Most Viewed</button>
            <button onClick={() => sortPuzzles('timestamp')}>Recent</button>
          </div>
          <div className="puzzle-grid">
            {puzzles.map((puzzle: Puzzle) => {
              return (
                <PuzzleCard
                  key={puzzle.id}
                  id={puzzle.id}
                  title={puzzle.title}
                  author={puzzle.author}
                  image={puzzle.image}
                  timestamp={puzzle.timestamp}
                  likes={puzzle.likes}
                  views={puzzle.views}
                />
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

export default Puzzles;
