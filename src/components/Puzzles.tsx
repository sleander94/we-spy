import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore/lite';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { db } from '../firebase/client';
import { Puzzle } from '../types.d';

const Puzzles = () => {
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);

  const storage = getStorage();

  // Get all puzzles from firestore & their image URLS from storage before setting state
  useEffect(() => {
    const getPuzzles = async () => {
      try {
        const results = await getDocs(collection(db, 'puzzles'));
        let data: any = [];
        results.forEach((puzzle) => {
          let info = puzzle.data();
          info.id = puzzle.id;
          data.push(info);
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
        {puzzles.map((puzzle: any) => {
          return (
            <div className="puzzle" key={puzzle.id}>
              <a href={`/puzzles/${puzzle.id}`}>
                <h2>{puzzle.title}</h2>
                <img src={puzzle.image} alt="puzzle thumbnail" />
                <p>{puzzle.author}</p>
              </a>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default Puzzles;
