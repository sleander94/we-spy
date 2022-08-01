import { doc, setDoc, collection } from 'firebase/firestore/lite';
import { ref, getStorage, uploadBytes } from 'firebase/storage';
import { FormEvent, SyntheticEvent, useEffect, useRef, useState } from 'react';
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

  const loadImage = (e: SyntheticEvent) => {
    const imageInput = e.target as HTMLInputElement;
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

  // Render canvas or show errors depending on title & image file content
  const [imageSelected, setImageSelected] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const validateTitleForm = () => {
    if (title.length == 0) setError('Enter a title.');
    else if (imageSrc.length == 0) setError('Select an image.');
    else setImageSelected(true);
  };

  // Get width & height of image & set canvas dimensions (run on image load)
  const [canvasWidth, setCanvasWidth] = useState<number>(0);
  const [canvasHeight, setCanvasHeight] = useState<number>(0);

  const scaleCanvas = (e: SyntheticEvent) => {
    const puzzleImage = e.target as HTMLImageElement;
    const width = puzzleImage.width;
    const height = puzzleImage.height;
    setCanvasWidth(width);
    setCanvasHeight(height);
  };

  // Store hidden items in state & set up reference for remove item eventlistener (avoids stale state)
  const [hiddenItems, setHiddenItems] = useState<HiddenItem[]>([]);
  const refItems = useRef(hiddenItems);
  useEffect(() => {
    refItems.current = hiddenItems;
  }, [hiddenItems]);

  // Save information about current item to add to hiddenItems
  const [description, setDescription] = useState<string>('');
  const [itemCoords, setItemCoords] = useState<Array<number>>([]);
  const [getDesc, setGetDesc] = useState<boolean>(false);
  const [placingRect, setPlacingRect] = useState<boolean>(false);

  const getItemArea = (description: string) => {
    // Remove description input & add instructions before drawing
    setGetDesc(false);
    setPlacingRect(true);
    // NOT VERY REACT - DO THIS WITHOUT DOM MANIPULATION
    // Create new canvas & set up coord variables for drawing rectangles
    const board = document.getElementById('board');
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    board?.appendChild(canvas);
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

      // Save starting position of rectangle & add event listener for animation
      const startRect = (e: MouseEvent) => {
        x1 = (e.clientX - rect.left) / rect.width;
        y1 = (e.clientY - rect.top) / rect.height;
        canvas.addEventListener('mousemove', animateRect);
      };

      // Clear canvas & redraw rectangle to current mouse position
      const animateRect = (e: MouseEvent) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        x2 = (e.clientX - rect.left) / rect.width;
        y2 = (e.clientY - rect.top) / rect.height;
        // Scale rectangle with canvas dimensions & draw using integers
        ctx.strokeRect(
          Math.round(x1 * canvas.width),
          Math.round(y1 * canvas.height),
          Math.round(x2 * canvas.width) - Math.round(x1 * canvas.width),
          Math.round(y2 * canvas.height) - Math.round(y1 * canvas.height)
        );
      };

      // Draw final rectangle, clean up eventlisteners, & save coords
      const endRect = (e: MouseEvent) => {
        canvas.removeEventListener('mousemove', animateRect);
        x2 = (e.clientX - rect.left) / rect.width;
        y2 = (e.clientY - rect.top) / rect.height;
        ctx.strokeRect(
          Math.round(x1 * canvas.width),
          Math.round(y1 * canvas.height),
          Math.round(x2 * canvas.width) - Math.round(x1 * canvas.width),
          Math.round(y2 * canvas.height) - Math.round(y1 * canvas.height)
        );
        canvas.removeEventListener('mousedown', startRect);
        canvas.removeEventListener('mouseup', endRect);
        setItemCoords([x1, x2, y1, y2]);
        setPlacingRect(false);
        // DON'T ALLOW MULTIPLE CANVASES TO BE LISTENING

        // Create button at start location of rectangle - delete canvas & remove item from state on click
        const remove = document.createElement('button') as HTMLButtonElement;
        remove.textContent = 'X';
        remove.addEventListener('click', () => {
          board?.removeChild(canvas);
          board?.removeChild(remove);
          const filteredItems = refItems.current.filter(
            (item) => item.description !== description
          );
          setHiddenItems(filteredItems);
        });
        remove.style.position = 'absolute';
        remove.style.top = Math.round(y1 * 100).toString() + '%';
        remove.style.left = Math.round(x1 * 100).toString() + '%';
        board?.appendChild(remove);
      };
      // Start listening for input
      canvas.addEventListener('mousedown', startRect);
      canvas.addEventListener('mouseup', endRect);
    }
  };

  // Add new hidden item to array every time new coords are received from canvas
  useEffect(() => {
    const saveItem = () => {
      if (description.length) {
        // Get X & Y min & max values by sorting arrays numerically
        const xVals = [itemCoords[0], itemCoords[1]].sort((a, b) => {
          return a - b;
        });
        const yVals = [itemCoords[2], itemCoords[3]].sort((a, b) => {
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
        const tempItems = [...hiddenItems];
        tempItems.push(newItem);
        setHiddenItems(tempItems);
      }
    };
    saveItem();
  }, [itemCoords]);

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
                return <li key={item.description}>{item.description}</li>;
              })}
              {!getDesc && !placingRect && (
                <button type="button" onClick={() => setGetDesc(true)}>
                  Add Item
                </button>
              )}
              {placingRect && (
                <p className="drag-instructions">Click and drag on image!</p>
              )}
              {getDesc && (
                <div className="description">
                  <input
                    type="text"
                    name="description"
                    placeholder="Enter a unique description."
                    onChange={handleChange('description')}
                  />
                  <button
                    type="button"
                    onClick={() => getItemArea(description)}
                  >
                    Set Area
                  </button>
                </div>
              )}
            </ol>
            <form onSubmit={uploadPuzzle}>
              <button type="submit">Create Puzzle</button>
            </form>
          </div>
          <div id="board" className="board">
            <img src={imageSrc} alt="" onLoad={scaleCanvas} />
          </div>
        </div>
      )}
    </section>
  );
};

export default PuzzleForm;
