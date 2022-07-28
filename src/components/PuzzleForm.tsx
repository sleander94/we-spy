import { doc, setDoc, collection } from 'firebase/firestore/lite';
import { ref, getStorage, uploadBytes } from 'firebase/storage';
import { FormEvent, SyntheticEvent, useState } from 'react';
import { db } from '../firebase/client';
import { FormProps, PuzzleData } from '../types.d';

const PuzzleForm = ({ username, loggedIn, userId }: FormProps) => {
  const [title, setTitle] = useState<string>('');

  const storage = getStorage();

  const handleChange = (e: SyntheticEvent) => {
    let target = e.target as HTMLInputElement;
    setTitle(target.value);
  };

  const uploadPuzzle = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const image = document.getElementById('image') as HTMLInputElement;
    if (image.files) {
      const file = image.files[0];
      const imageName = image.files[0].name;
      const imageRef = ref(storage, `puzzles/${imageName}`);

      uploadBytes(imageRef, file).then((snapshot) => {
        console.log('Uploaded image');
      });

      await setDoc(doc(collection(db, 'puzzles')), {
        author: username,
        authorId: userId,
        title: title,
        timestamp: new Date(),
        image: `puzzles/${imageName}`,
        hiddenItems: [],
      });
    }
  };

  return (
    <section id="puzzle-form">
      <form onSubmit={uploadPuzzle}>
        <div className="form-field">
          <label htmlFor="title">Title: </label>
          <input type="text" name="title" onChange={handleChange} required />
        </div>
        <div className="form-field">
          <label htmlFor="image">Image: </label>
          <input type="file" name="image" id="image" required />
        </div>
        <button type="submit">Add Puzzle</button>
      </form>
    </section>
  );
};

export default PuzzleForm;
