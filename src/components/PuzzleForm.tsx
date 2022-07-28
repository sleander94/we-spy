import { doc, setDoc, collection } from 'firebase/firestore/lite';
import { ref, getStorage, uploadBytes } from 'firebase/storage';
import { FormEvent, SyntheticEvent, useEffect, useState } from 'react';
import { db } from '../firebase/client';
import { FormProps } from '../types.d';

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
    const puzzleImage = document.getElementById(
      'puzzle-preview'
    ) as HTMLImageElement;
    const image = document.getElementById('image') as HTMLInputElement;
    if (image.files) {
      const file = image.files[0];
      const reader = new FileReader();
      reader.addEventListener(
        'load',
        () => {
          if (typeof reader.result == 'string') puzzleImage.src = reader.result;
        },
        false
      );

      if (file) reader.readAsDataURL(file);
    }
  };

  const [hiddenItems, setHiddenItems] = useState<any[]>([]);

  const [description, setDescription] = useState<string>('');
  const [x1, setX1] = useState<number>(0);
  const [y1, setY1] = useState<number>(0);
  const [x2, setX2] = useState<number>(0);
  const [y2, setY2] = useState<number>(0);
  const [getDesc, setGetDesc] = useState<boolean>(false);

  const getItemArea = () => {
    // Set up canvas information
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = '#FF0000';
      let x1 = 0,
        x2 = 0,
        y1 = 0,
        y2 = 0;
      // Add eventlisteners to click & drag to draw a rectangle
      const startRect = (e: MouseEvent) => {
        x1 = Math.round(
          ((e.clientX - rect.left) / (rect.right - rect.left)) * canvas.width
        );
        y1 = Math.round(
          ((e.clientY - rect.top) / (rect.bottom - rect.top)) * canvas.height
        );
      };
      const endRect = (e: MouseEvent) => {
        x2 = Math.round(
          ((e.clientX - rect.left) / (rect.right - rect.left)) * canvas.width
        );
        y2 = Math.round(
          ((e.clientY - rect.top) / (rect.bottom - rect.top)) * canvas.height
        );
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
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

    const newItem = {
      description: description,
      minX: xVals[0],
      maxX: xVals[1],
      minY: yVals[0],
      maxY: yVals[1],
    };

    const tempItems = hiddenItems;
    tempItems.push(newItem);
    setHiddenItems(tempItems);
    setGetDesc(false);
    console.log(hiddenItems);
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
        <img
          src=""
          alt="puzzle preview"
          id="puzzle-preview"
          className="puzzle-preview"
        />
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
