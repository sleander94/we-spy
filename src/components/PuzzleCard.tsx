import { PuzzleCardProps } from '../types.d';

const PuzzleCard = ({
  id,
  title,
  author,
  image,
  timestamp,
}: PuzzleCardProps) => {
  return (
    <div className="puzzle">
      <a href={`/puzzles/${id}`}>{title}</a>
      <a href={`/puzzles/${id}`}>
        <img src={image} alt="puzzle thumbnail" />
      </a>
      <div className="author-date">
        <p>{author}</p>
        <p>{timestamp?.toDate().toLocaleDateString()}</p>
      </div>
    </div>
  );
};

export default PuzzleCard;
