import { doc, setDoc } from 'firebase/firestore/lite';
import { ref, getStorage, uploadBytes } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import {
  FormEvent,
  SyntheticEvent,
  ChangeEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { db } from '../firebase/client';
import { UserProps, HiddenItem } from '../types.d';
import ImageSelector from './ImageSelector';

const PuzzleForm = ({ username, userId, loggedIn }: UserProps) => {
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

  const loadImage = (e: ChangeEvent<HTMLInputElement>) => {
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
      ctx.strokeStyle = '#bf4f45';
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
        remove.style.top = (y1 * 100).toString() + '%';
        remove.style.left = (x1 * 100).toString() + '%';
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

  const [uploading, setUploading] = useState<boolean>(false);
  const [uploaded, setUploaded] = useState<boolean>(false);

  const [id, setId] = useState<string>('');

  const uploadPuzzle = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const storage = getStorage();

    // Upload image file to firebase storage
    if (imageFile) {
      setUploading(true);
      const imageRef = ref(storage, `puzzles/${imageName}`);
      try {
        await uploadBytes(imageRef, imageFile).then(() => {
          console.log('Uploaded image');
        });

        // Generate id & date for puzzle
        const newId = uuidv4();
        setId(newId);
        const newDate = new Date();

        // Upload puzzle document to firestore
        await setDoc(doc(db, 'puzzles', newId), {
          author: username,
          authorId: userId,
          title: title,
          timestamp: newDate,
          image: `puzzles/${imageName}`,
          hiddenItems: hiddenItems,
          likes: [],
          views: 0,
        });

        // Create leaderboard for puzzle
        await setDoc(doc(db, 'leaderboards', newId), {
          author: username,
          title: title,
          timestamp: newDate,
          image: `puzzles/${imageName}`,
          scores: [],
        });

        setUploading(false);
        setUploaded(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <section id="puzzle-form">
      {!imageSelected && (
        <ImageSelector
          handleChange={handleChange}
          loadImage={loadImage}
          validateTitleForm={validateTitleForm}
          error={error}
          imageLoaded={imageLoaded}
          imageSrc={imageSrc}
        />
      )}
      {imageSelected && (
        <div className="hidden-items">
          <div className="items">
            <h2>Hidden Items</h2>
            <ol>
              {hiddenItems.map((item) => {
                return (
                  <li key={item.description}>
                    {hiddenItems.indexOf(item) + 1}. {item.description}
                  </li>
                );
              })}
              {!getDesc && !placingRect && (
                <button type="button" onClick={() => setGetDesc(true)}>
                  Add Item
                </button>
              )}
              {getDesc && (
                <div className="description">
                  <input
                    type="text"
                    name="description"
                    placeholder="Enter a unique description."
                    onChange={handleChange('description')}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => getItemArea(description)}
                  >
                    Confirm and Set Area
                  </button>
                </div>
              )}
              {placingRect && (
                <p className="drag-instructions">Click and drag on image!</p>
              )}
            </ol>

            <form onSubmit={uploadPuzzle}>
              {!uploading && !uploaded && hiddenItems.length > 0 && (
                <button type="submit">Create Puzzle</button>
              )}
              {!uploading && !uploaded && hiddenItems.length == 0 && (
                <p>Add some items!</p>
              )}
            </form>
          </div>
          {!uploading && !uploaded && (
            <div id="board" className="board">
              <img id="image" src={imageSrc} alt="" onLoad={scaleCanvas} />
            </div>
          )}
          {uploading && <div className="uploading">Uploading Puzzle</div>}
          {uploaded && (
            <div className="uploaded">
              <p>Puzzle Successfully Uploaded</p>
              <a href={`/puzzles/${id}`}>Go to puzzle</a>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default PuzzleForm;
