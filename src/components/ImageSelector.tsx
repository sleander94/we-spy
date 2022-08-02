import { ImageSelectorProps } from '../types.d';

const ImageSelector = ({
  handleChange,
  loadImage,
  validateTitleForm,
  error,
  imageLoaded,
  imageSrc,
}: ImageSelectorProps) => {
  return (
    <div id="image-selector">
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
      <button type="button" onClick={() => validateTitleForm()}>
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
  );
};

export default ImageSelector;
