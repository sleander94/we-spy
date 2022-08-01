import { doc, setDoc, collection } from 'firebase/firestore/lite';
import { ref, getStorage, uploadBytes } from 'firebase/storage';
import { FormEvent, SyntheticEvent, useState } from 'react';
import { db } from '../firebase/client';
import { FormProps, HiddenItem } from '../types.d';

const PuzzleForm = ({ username, userId }: FormProps) => {
  // Set title in state on user input
  const [title, setTitle] = useState<string>('');

  const handleChange = (name: string) => (e: SyntheticEvent) => {
    let target = e.target as HTMLInputElement;
    if (name == 'title') setTitle(target.value);
    if (name == 'description') setDescription(target.value);
  };

  // Get image file information from input element & save it in state
  const [imageSrc, setImageSrc] = useState<string>('');
  const [imageFile, setImageFile] = useState<Blob>();
  const [imageName, setImageName] = useState<string>('');
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  const loadImage = () => {
    const imageInput = document.getElementById('image') as HTMLInputElement;
    if (imageInput.files) {
      const file = imageInput.files[0];
      const reader = new FileReader();
      reader.addEventListener(
        'load',
        () => {
          if (typeof reader.result == 'string') {
            setImageSrc(reader.result);
            setImageFile(file);
            setImageName(file.name);
            setImageLoaded(true);
          }
        },
        false
      );
      if (file) reader.readAsDataURL(file);
    }
  };

  // Render canvas or show errors depending on title & image file
  const [imageSelected, setImageSelected] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const validateTitleForm = () => {
    if (title.length == 0) setError('Enter a title.');
    else if (imageSrc.length == 0) setError('Select an image.');
    else setImageSelected(true);
  };

  // Get width & height of image & set canvas dimensions
  const [canvasWidth, setCanvasWidth] = useState<number>(0);
  const [canvasHeight, setCanvasHeight] = useState<number>(0);

  const scaleCanvas = (e: SyntheticEvent) => {
    const puzzleImage = e.target as HTMLImageElement;
    const width = puzzleImage.width;
    const height = puzzleImage.height;
    setCanvasWidth(width);
    setCanvasHeight(height);
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
    // Set up canvas information & coord variables for drawing rectangles
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    let x1 = 0,
      x2 = 0,
      y1 = 0,
      y2 = 0;
    if (ctx) {
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 2;
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

    const storage = getStorage();
    // Upload image file to firebase storage
    if (imageFile) {
      const imageRef = ref(storage, `puzzles/${imageName}`);

      uploadBytes(imageRef, imageFile).then((snapshot) => {
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
      {!imageSelected && (
        <div className="title-and-image">
          <div className="title">
            <label htmlFor="title">Title: </label>
            <input
              type="text"
              name="title"
              onChange={handleChange('title')}
              required
            />
          </div>
          <div className="image">
            <label htmlFor="image" className="image-label">
              Upload Image
            </label>
            <input
              type="file"
              name="image"
              id="image"
              onChange={loadImage}
              required
            />
          </div>
          <button type="button" onClick={validateTitleForm}>
            Use this image
          </button>
          {error.length > 0 && <p className="error">{error}</p>}
          <div id="image-preview">
            {imageLoaded && (
              <img src={imageSrc} alt="puzzle preview" id="puzzle-image"></img>
            )}
            <p>Select an image to preview.</p>
          </div>
        </div>
      )}
      {imageSelected && (
        <div className="hidden-items">
          <div className="items">
            <h2>Hidden Items</h2>
            <ol>
              {hiddenItems.map((item) => {
                return (
                  <li key={hiddenItems.indexOf(item)}>{item.description}</li>
                );
              })}
              {getDesc && (
                <div className="description">
                  <input
                    type="text"
                    name="description"
                    placeholder="Enter a description."
                    onChange={handleChange('description')}
                  />
                  <button type="button" onClick={saveItem}>
                    Save Item
                  </button>
                </div>
              )}
            </ol>
            <button type="button" onClick={getItemArea}>
              Add Item
            </button>
            <form onSubmit={uploadPuzzle}>
              <button type="submit">Add Puzzle</button>
            </form>
          </div>
          <div id="board" className="board">
            <canvas
              id="canvas"
              width={canvasWidth}
              height={canvasHeight}
            ></canvas>
            <img src={imageSrc} alt="" onLoad={scaleCanvas} />
          </div>
        </div>
      )}
    </section>
  );
};

export default PuzzleForm;
