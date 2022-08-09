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
  ReactElement,
} from 'react';
import { db } from '../firebase/client';
import { UserProps, HiddenItem } from '../types.d';
import ImageSelector from './ImageSelector';
import SelectionCanvas from './SelectionCanvas';

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
    else if (!imageFile?.type.startsWith('image/'))
      setError('File needs to be an image (jpg, png, svg, etc.)');
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
  const itemsRef = useRef(hiddenItems);
  useEffect(() => {
    itemsRef.current = hiddenItems;
  }, [hiddenItems]);

  // Handle marking of hidden item areas with canvases
  const [description, setDescription] = useState<string>('');
  const [itemCoords, setItemCoords] = useState<number[]>([]);
  const [getDesc, setGetDesc] = useState<boolean>(false);
  const [placingRect, setPlacingRect] = useState<boolean>(false);
  const [canvases, setCanvases] = useState<ReactElement[]>([]);

  const updateCoords = (x1: number, x2: number, y1: number, y2: number) => {
    setItemCoords([x1, x2, y1, y2]);
    setPlacingRect(false);
  };

  const filterItems = (description: string) => {
    const filteredItems = itemsRef.current.filter(
      (item) => item.description !== description
    );
    setHiddenItems(filteredItems);
  };

  const getItemArea = (description: string) => {
    setGetDesc(false);
    setPlacingRect(true);
    const newcanvas = (
      <SelectionCanvas
        key={description}
        width={canvasWidth}
        height={canvasHeight}
        currDescription={description}
        updateCoords={updateCoords}
        filterItems={filterItems}
      />
    );
    setCanvases([...canvases, newcanvas]);
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

    if (imageFile) {
      // Generate id & date for puzzle
      const newId = uuidv4();
      setId(newId);
      const newDate = new Date();

      // Upload image file to firebase storage
      setUploading(true);
      const imageRef = ref(storage, `puzzles/${newId}`);
      try {
        await uploadBytes(imageRef, imageFile).then(() => {
          console.log('Uploaded image');
        });

        // Upload puzzle document to firestore
        await setDoc(doc(db, 'puzzles', newId), {
          author: username,
          authorId: userId,
          title: title,
          timestamp: newDate,
          image: `${newId}`,
          hiddenItems: hiddenItems,
          likes: [],
          views: 0,
        });

        // Create leaderboard for puzzle
        await setDoc(doc(db, 'leaderboards', newId), {
          author: username,
          title: title,
          timestamp: newDate,
          image: `${newId}`,
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
      <div className="mobile-message">
        <div className="p-container">
          <p>Mobile puzzle creation is still in the works.</p>{' '}
          <p>For now, log in on a computer to create puzzles.</p>
        </div>
      </div>
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
      {imageSelected && !uploading && !uploaded && (
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
              {canvases.map((canvas) => {
                return canvas;
              })}
              <img id="image" src={imageSrc} alt="" onLoad={scaleCanvas} />
            </div>
          )}
        </div>
      )}
      {uploading && (
        <div className="uploading">
          <div className="rect1"></div>
          <div className="rect2"></div>
          <div className="rect3"></div>
        </div>
      )}
      {uploaded && (
        <div className="uploaded">
          <p>Puzzle Successfully Uploaded</p>
          <a href={`/puzzles/${id}`}>Go to puzzle</a>
        </div>
      )}
    </section>
  );
};

export default PuzzleForm;
