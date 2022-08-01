import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore/lite';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { db } from '../firebase/client';
import { Puzzle } from '../types.d';
import PuzzleCard from './PuzzleCard';

const Puzzles = () => {
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);

  const storage = getStorage();

  // Get all puzzles from firestore & their image URLS from storage before setting state
  useEffect(() => {
    const getPuzzles = async () => {
      try {
        const results = await getDocs(
          query(collection(db, 'puzzles'), orderBy('timestamp', 'desc'))
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
      } catch (err) {
        console.error(err);
      }
    };
    getPuzzles();
  }, []);

  return (
    <section id="puzzles">
      <h1>Puzzles</h1>
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
            />
          );
        })}
      </div>
    </section>
  );
};

export default Puzzles;
