import { useState, useEffect } from 'react';
import {
  collection,
  getDoc,
  getDocs,
  doc,
  query,
  orderBy,
  startAfter,
  limit,
  DocumentData,
  QueryDocumentSnapshot,
  OrderByDirection,
} from 'firebase/firestore/lite';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { db } from '../firebase/client';
import { Puzzle } from '../types.d';
import PuzzleCard from './PuzzleCard';

const Puzzles = () => {
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sortMethod, setSortMethod] = useState<string>('views');
  const [firstPuzzle, setFirstPuzzle] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [lastPuzzle, setLastPuzzle] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  const storage = getStorage();

  const pageLimit = 8;
  const [count, setCount] = useState<number>(pageLimit);
  const [total, setTotal] = useState<number>(0);

  const getTotal = async () => {
    const result = await getDoc(doc(db, 'puzzle-total', 'total'));
    let data = result.data();
    setTotal(data?.count);
  };

  useEffect(() => {
    getTotal();
  }, []);

  // Get puzzles from firestore & their image URLS from storage before setting state
  const getPuzzles = async (
    dir: OrderByDirection,
    startIndex: QueryDocumentSnapshot<DocumentData> | null = null
  ) => {
    setLoading(true);
    try {
      let results;
      if (startIndex) {
        results = await getDocs(
          query(
            collection(db, 'puzzles'),
            orderBy(sortMethod, dir),
            startAfter(startIndex),
            limit(pageLimit)
          )
        );
      } else {
        results = await getDocs(
          query(
            collection(db, 'puzzles'),
            orderBy(sortMethod, dir),
            limit(pageLimit)
          )
        );
      }
      let docs = results.docs;
      if (dir === 'asc') docs = docs.reverse();
      let data: Puzzle[] = [];
      docs.forEach((puzzle) => {
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
      setFirstPuzzle(docs[0]);
      setLastPuzzle(docs[docs.length - 1]);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    getPuzzles('desc');
  }, [sortMethod]);

  return (
    <section id="puzzles">
      <h1>Puzzles</h1>
      {loading && (
        <div className="loading-container">
          <div className="rect1"></div>
          <div className="rect2"></div>
          <div className="rect3"></div>
        </div>
      )}
      {!loading && (
        <div id="puzzle-container">
          <div className="sort-buttons">
            <button
              className={sortMethod === 'views' ? 'active' : ''}
              onClick={() => {
                setCount(pageLimit);
                setSortMethod('views');
              }}
            >
              Top
            </button>
            <button
              className={sortMethod === 'timestamp' ? 'active' : ''}
              onClick={() => {
                setCount(pageLimit);
                setSortMethod('timestamp');
              }}
            >
              Recent
            </button>
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
          <div className="page-container">
            <button
              onClick={() => {
                if (count > pageLimit) {
                  setCount(count - pageLimit);
                  getPuzzles('asc', firstPuzzle);
                }
              }}
            >
              {'<'} prev
            </button>
            <button
              onClick={() => {
                if (count < total) {
                  setCount(count + pageLimit);
                  getPuzzles('desc', lastPuzzle);
                }
              }}
            >
              next {'>'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default Puzzles;
