import { doc, setDoc, collection } from 'firebase/firestore/lite';
import { ref, getStorage, uploadBytes } from 'firebase/storage';
import { FormEvent, SyntheticEvent, useEffect, useState } from 'react';
import { db } from '../firebase/client';
import { FormProps, HiddenItem } from '../types.d';

const PuzzleForm = ({ username, userId, loggedIn }: FormProps) => {
  const storage = getStorage();

  const [title, setTitle] = useState<string>('');

  const handleChange = (name: string) => (e: SyntheticEvent) => {
    let target = e.target as HTMLInputElement;
    if (name == 'title') setTitle(target.value);
    if (name == 'description') setDescription(target.value);
  };

  // Overlay puzzle image onto canvas when file is selected
  const loadImage = () => {
    const image = document.getElementById('image') as HTMLInputElement;
    if (image.files) {
      const file = image.files[0];
      const reader = new FileReader();
      reader.addEventListener(
        'load',
        () => {
          // Remove the previously selected image before loading the new one
          const board = document.getElementById('board');
          const prevImage = document.getElementById('puzzle-image');
          if (prevImage) board?.removeChild(prevImage);
          if (typeof reader.result == 'string') {
            // Create the image & add it to the DOM
            const puzzleImage = document.createElement(
              'img'
            ) as HTMLImageElement;
            puzzleImage.id = 'puzzle-image';
            puzzleImage.alt = 'puzzle image';
            puzzleImage.src = reader.result;
            board?.appendChild(puzzleImage);
            // After image is loaded, get width & height & adjust canvas
            puzzleImage.addEventListener('load', () => {
              const width = puzzleImage.width;
              const height = puzzleImage.height;
              const canvas = document.getElementById(
                'canvas'
              ) as HTMLCanvasElement;
              canvas.style.width = `${width}px`;
              canvas.style.height = `${height}px`;
            });
          }
        },
        false
      );
      if (file) reader.readAsDataURL(file);
    }
  };

  // Declare state for adding hidden items to puzzle
  const [hiddenItems, setHiddenItems] = useState<HiddenItem[]>([]);
  const [description, setDescription] = useState<string>('');
  const [x1, setX1] = useState<number>(0);
  const [y1, setY1] = useState<number>(0);
  const [x2, setX2] = useState<number>(0);
  const [y2, setY2] = useState<number>(0);
  const [getDesc, setGetDesc] = useState<boolean>(false);

  const getItemArea = () => {
    // Set up canvas information & coord variables
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    let x1 = 0,
      x2 = 0,
      y1 = 0,
      y2 = 0;
    if (ctx) {
      ctx.strokeStyle = '#FF0000';
      // Add eventlisteners to click & drag to draw a rectangle
      const startRect = (e: MouseEvent) => {
        x1 = (e.clientX - rect.left) / rect.width;
        y1 = (e.clientY - rect.top) / rect.height;
      };
      const endRect = (e: MouseEvent) => {
        x2 = (e.clientX - rect.left) / rect.width;
        y2 = (e.clientY - rect.top) / rect.height;
        // Scale rectangle with canvas dimensions & draw using integers
        ctx.strokeRect(
          Math.round(x1 * canvas.width),
          Math.round(y1 * canvas.height),
          Math.round(x2 * canvas.width) - Math.round(x1 * canvas.width),
          Math.round(y2 * canvas.height) - Math.round(y1 * canvas.height)
        );
        // Remove eventlisteners, save coords in state, & get item description after drawing
        canvas.removeEventListener('mousedown', startRect);
        canvas.removeEventListener('mouseup', endRect);
        setX1(x1);
        setY1(y1);
        setX2(x2);
        setY2(y2);
        setGetDesc(true);
      };
      canvas.addEventListener('mousedown', startRect);
      canvas.addEventListener('mouseup', endRect);
    }
  };

  const saveItem = () => {
    // Get X & Y min & max values by sorting arrays numerically
    const xVals = [x1, x2].sort((a, b) => {
      return a - b;
    });
    const yVals = [y1, y2].sort((a, b) => {
      return a - b;
    });

    // Create new hidden item
    const newItem = {
      description: description,
      minX: xVals[0],
      maxX: xVals[1],
      minY: yVals[0],
      maxY: yVals[1],
    };

    // Add new hidden items list to state
    const tempItems = hiddenItems;
    tempItems.push(newItem);
    setHiddenItems(tempItems);
    setGetDesc(false);
  };

  const uploadPuzzle = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Upload image file to firebase storage
    const image = document.getElementById('image') as HTMLInputElement;
    if (image.files) {
      const file = image.files[0];
      const imageName = image.files[0].name;
      const imageRef = ref(storage, `puzzles/${imageName}`);

      uploadBytes(imageRef, file).then((snapshot) => {
        console.log('Uploaded image');
      });

      // Upload puzzle document to firestore
      await setDoc(doc(collection(db, 'puzzles')), {
        author: username,
        authorId: userId,
        title: title,
        timestamp: new Date(),
        image: `puzzles/${imageName}`,
        hiddenItems: hiddenItems,
      });
    }
  };

  return (
    <section id="puzzle-form">
      <div className="items">
        <h2>Hidden Items</h2>
        <ol>
          {hiddenItems.map((item) => {
            return <li key={hiddenItems.indexOf(item)}>{item.description}</li>;
          })}
        </ol>
        <button type="button" onClick={getItemArea}>
          Add Item
        </button>
      </div>
      <div className="title">
        <label htmlFor="title">Title: </label>
        <input
          type="text"
          name="title"
          onChange={handleChange('title')}
          required
        />
      </div>
      <div id="board" className="board">
        {getDesc && (
          <div className="description">
            <h3>Description</h3>
            <input
              type="text"
              name="description"
              onChange={handleChange('description')}
              required
            />
            <button type="button" onClick={saveItem}>
              Save Item
            </button>
          </div>
        )}
        <canvas id="canvas"></canvas>
      </div>
      <div className="image">
        <label htmlFor="image">Image: </label>
        <input
          type="file"
          name="image"
          id="image"
          onChange={loadImage}
          required
        />
      </div>
      <form onSubmit={uploadPuzzle}>
        <button type="submit">Add Puzzle</button>
      </form>
    </section>
  );
};

export default PuzzleForm;
