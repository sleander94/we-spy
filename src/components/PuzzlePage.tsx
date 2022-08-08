import { useParams } from 'react-router-dom';
import { useState, useEffect, useRef, SyntheticEvent, MouseEvent } from 'react';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore/lite';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { db } from '../firebase/client';
import { HiddenItem, Puzzle, FormProps } from '../types.d';
import ScoreUploader from './ScoreUploader';
import Selector from './Selector';

const PuzzlePage = ({ username, userId }: FormProps) => {
  const { id } = useParams<string>();
  const [puzzle, setPuzzle] = useState<Puzzle>();
  const [hiddenItems, setHiddenItems] = useState<HiddenItem[]>([]);

  // Get puzzle from firestore & image URL from storage before setting state

  const [imageSrc, setImageSrc] = useState<string>('');
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  const storage = getStorage();

  useEffect(() => {
    const getPuzzle = async () => {
      try {
        const results = await getDoc(doc(db, 'puzzles', `${id}`));
        let data = results.data() as Puzzle;
        const url = await getDownloadURL(ref(storage, `puzzles/${data.image}`));
        data.image = url;

        setPuzzle(data);
        setHiddenItems(data.hiddenItems);
        setImageSrc(url);
        setImageLoaded(true);
      } catch (err) {
        console.error(err);
      }
    };

    // Increase views by 1
    const addView = async () => {
      try {
        await updateDoc(doc(db, 'puzzles', `${id}`), {
          views: increment(1),
        });
      } catch (err) {
        console.error(err);
      }
    };
    getPuzzle();
    addView();
  }, []);

  // Keep canvas the same size as image when window size is adjusted
  const [canvasWidth, setCanvasWidth] = useState<number>(0);
  const [canvasHeight, setCanvasHeight] = useState<number>(0);

  const scaleCanvas = (e: SyntheticEvent) => {
    const puzzleImage = e.target as HTMLImageElement;
    setCanvasWidth(puzzleImage.width);
    setCanvasHeight(puzzleImage.height);
    setTimer(0.1);
    setGameStart(true);
  };

  // Start game & timer after getting hidden items from puzzle, stop when all items are found
  const [timer, setTimer] = useState<number>(0);
  const [gameStart, setGameStart] = useState<boolean>(false);

  useEffect(() => {
    if (hiddenItems.length > 0) {
      const count = setInterval(
        () => setTimer((timer * 10 + 0.1 * 10) / 10),
        100
      );
      return () => clearInterval(count);
    }
  }, [timer]);

  // Show Selector component & save mouse location in state on canvas click
  const [selector, setSelector] = useState<boolean>(false);
  const [x, setX] = useState<number>(0);
  const [y, setY] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const displaySelector = (e: MouseEvent) => {
    const canvas = canvasRef.current?.getBoundingClientRect();
    if (canvas) {
      let x = (e.clientX - canvas.left) / canvas.width;
      let y = (e.clientY - canvas.top) / canvas.height;
      setX(Number(x));
      setY(Number(y));
      setSelector(!selector);
    }
  };

  // If x & y from mouse event are within item's coordinates, remove it from hiddenItems & mark it off list
  const handleGuess = (description: string) => {
    for (const item of hiddenItems) {
      if (item.description == description) {
        if (x < item.maxX && x > item.minX && y < item.maxY && y > item.minY) {
          if (hiddenItems.indexOf(item) || hiddenItems.indexOf(item) == 0) {
            const filteredItems = hiddenItems.filter(
              (currItem) => item.description !== currItem.description
            );
            setHiddenItems(filteredItems);
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
      {hiddenItems.length == 0 && gameStart && (
        <ScoreUploader username={username} timer={Number(timer)} />
      )}
      <div className="gameboard">
        <div id="game-text" className="game-text">
          <h2>{puzzle?.title}</h2>
          <ol>
            {puzzle?.hiddenItems.map((item: HiddenItem) => {
              return (
                <li
                  id={item.description}
                  key={puzzle.hiddenItems.indexOf(item)}
                  className={hiddenItems.includes(item) ? '' : 'found'}
                >
                  {puzzle.hiddenItems.indexOf(item) + 1}. {item.description}
                </li>
              );
            })}
            <p className="timer">Time: {timer.toFixed(1)} sec</p>
          </ol>
        </div>
        <div id="game-image" className="game-image">
          {selector && (
            <Selector
              x={x}
              y={y}
              hiddenItems={hiddenItems}
              handleGuess={handleGuess}
            />
          )}
          {imageLoaded && (
            <img id="image" src={imageSrc} alt="" onLoad={scaleCanvas} />
          )}
          <canvas
            ref={canvasRef}
            id="canvas"
            width={canvasWidth}
            height={canvasHeight}
            onClick={displaySelector}
          ></canvas>
        </div>
      </div>
    </section>
  );
};

export default PuzzlePage;
