import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore/lite';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { db } from '../firebase/client';
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
  const [activeItem, setActiveItem] = useState<string>('');
  const [timer, setTimer] = useState<number>(0);

  const storage = getStorage();

  // Start a timer after getting puzzle info, stop when all items are found
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

  // Set the first hidden item to active after puzzle is loaded
  useEffect(() => {
    if (puzzle.hiddenItems.length > 0) {
      const description = puzzle.hiddenItems[0].description;
      const firstItem = document.getElementById(description);
      firstItem?.classList.add('active');
      setActiveItem(description);
    }
  }, [puzzle]);

  // If mouse location is within item's coordinates, remove it from hiddenItems & mark it off list
  const handleGuess = (description: string) => (e: any) => {
    // Get coordinates of mouse click on canvas
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    let x = (e.clientX - rect.left) / rect.width;
    let y = (e.clientY - rect.top) / rect.height;

    // Check if active item's location matches mouse coordinates
    for (const item of hiddenItems) {
      if (item.description == description) {
        if (x < item.maxX && x > item.minX && y < item.maxY && y > item.minY) {
          // Remove item from hiddenItems if guess is successful
          if (hiddenItems.indexOf(item) || hiddenItems.indexOf(item) == 0) {
            const filteredItems = hiddenItems.filter(
              (currItem) => item.description !== currItem.description
            );
            setHiddenItems(filteredItems);

            // Remove active class & mark item as found
            const itemEl = document.getElementById(
              item.description
            ) as HTMLElement;
            itemEl.classList.add('found');
            itemEl.classList.remove('active');

            // Set the next unfound item to active
            const nextItem = document.querySelector('li:not(.found)');
            if (nextItem) {
              nextItem.classList.add('active');
              setActiveItem(nextItem.id);
            }
          }
        } else {
          console.log('Try again!');
        }
      }
    }
  };

  // Remove active status from currently active item & apply it to clicked item
  const changeActive = (description: string) => (e: any) => {
    const elements = document.getElementsByClassName('active');
    const currActive = elements[0];
    if (currActive) currActive.classList.remove('active');
    const newActive = e.target as HTMLElement;
    newActive.classList.add('active');
    setActiveItem(description);
  };

  return (
    <section id="puzzle-page">
      <div className="gameboard">
        <div className="game-text">
          <h2>{puzzle.title}</h2>
          <ol>
            {puzzle.hiddenItems.map((item: HiddenItem) => {
              return (
                <li
                  id={item.description}
                  key={puzzle.hiddenItems.indexOf(item)}
                  onClick={changeActive(item.description)}
                >
                  {puzzle.hiddenItems.indexOf(item) + 1}. {item.description}
                </li>
              );
            })}
          </ol>
          <p className="timer">{timer}</p>
        </div>
        <div id="game-image" className="game-image">
          <canvas id="canvas" onClick={handleGuess(activeItem)}></canvas>
        </div>
      </div>
    </section>
  );
};

export default PuzzlePage;
