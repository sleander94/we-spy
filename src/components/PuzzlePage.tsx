import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore/lite';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { db } from '../firebase/client';
import Selector from './Selector';
import { HiddenItem, Puzzle } from '../types.d';

const PuzzlePage = () => {
  const { id } = useParams<string>();
  const [puzzle, setPuzzle] = useState<Puzzle>({
    author: '',
    authorId: '',
    title: '',
    image: '',
    hiddenItems: [],
  });
  const [hiddenItems, setHiddenItems] = useState<Array<HiddenItem>>([]);
  const [x, setX] = useState<number>(0);
  const [y, setY] = useState<number>(0);
  const [selector, setSelector] = useState<boolean>(false);

  const storage = getStorage();

  // Start a timer after getting puzzle info, stop when all items are found
  const [timer, setTimer] = useState<number>(0);

  useEffect(() => {
    if (hiddenItems.length > 0) {
      const count = setInterval(
        () => setTimer((timer * 10 + 0.1 * 10) / 10),
        100
      );
      return () => clearInterval(count);
    }
  }, [timer]);

  // Get puzzle from firestore & image URL from storage before setting state
  useEffect(() => {
    const getPuzzle = async () => {
      try {
        const results = await getDoc(doc(db, 'puzzles', `${id}`));
        let data = results.data() as Puzzle;
        const url = await getDownloadURL(ref(storage, data.image));
        data.image = url;
        setPuzzle(data);
        setHiddenItems(data.hiddenItems);
        // Create & append image with correct source
        const puzzleImage = document.createElement('img') as HTMLImageElement;
        puzzleImage.id = 'puzzle-image';
        puzzleImage.alt = 'puzzle image';
        puzzleImage.src = url;
        const gameImage = document.getElementById('game-image');
        gameImage?.appendChild(puzzleImage);
        // After image is loaded, get width & height & adjust canvas
        puzzleImage.addEventListener('load', () => {
          const width = puzzleImage.width;
          const height = puzzleImage.height;
          const canvas = document.getElementById('canvas') as HTMLCanvasElement;
          canvas.style.width = `${width}px`;
          canvas.style.height = `${height}px`;
          // Initialize timer after image is loaded
          setTimer(0.1);
        });
      } catch (err) {
        console.error(err);
      }
    };
    getPuzzle();

    // Add class to Navbar to adjust left margin
    const nav = document.getElementById('nav');
    nav?.classList.add('game-nav');
  }, []);

  // Display list of hidden items at mouse location
  const displaySelector = (e: any) => {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    let x = (e.clientX - rect.left) / rect.width;
    let y = (e.clientY - rect.top) / rect.height;
    setX(parseFloat(x.toFixed(2)));
    setY(parseFloat(y.toFixed(2)));
    setSelector(!selector);
  };

  // If mouse location is within item's coordinates, remove it from hiddenItems & mark it off list
  const checkCoords = (description: string) => {
    for (const item of hiddenItems) {
      if (item.description == description) {
        if (x < item.maxX && x > item.minX && y < item.maxY && y > item.minY) {
          if (hiddenItems.indexOf(item) || hiddenItems.indexOf(item) == 0) {
            const filteredItems = hiddenItems.filter(
              (currItem) => item.description !== currItem.description
            );
            setHiddenItems(filteredItems);
            const itemEl = document.getElementById(
              item.description
            ) as HTMLElement;
            itemEl.classList.add('found');
            setSelector(!selector);
          }
        } else {
          console.log('Try again!');
        }
      }
    }
  };

  return (
    <section id="puzzle-page">
      <p>{puzzle.title}</p>
      <div className="gameboard">
        <div className="game-text">
          <h2>Hidden</h2>
          <ol>
            {puzzle.hiddenItems.map((item: HiddenItem) => {
              return (
                <li
                  id={item.description}
                  key={puzzle.hiddenItems.indexOf(item)}
                >
                  {puzzle.hiddenItems.indexOf(item) + 1}. {item.description}
                </li>
              );
            })}
          </ol>
          <p className="timer">{timer}</p>
        </div>
        <div id="game-image" className="game-image">
          {selector && (
            <Selector
              x={x}
              y={y}
              hiddenItems={hiddenItems}
              checkCoords={checkCoords}
            ></Selector>
          )}
          <canvas id="canvas" onClick={displaySelector}></canvas>
        </div>
      </div>
    </section>
  );
};

export default PuzzlePage;
