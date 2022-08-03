import { Link } from 'react-router-dom';
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
      <Link className="title" to={`/puzzles/${id}`}>
        {title}
      </Link>
      <a className="thumbnail" href={`/puzzles/${id}`}>
        <img src={image} alt="puzzle thumbnail" />
      </a>
      <div className="author-date">
        <p>{author.split(' ')[0]}</p>
        <Link to={`/leaderboards/${id}`}>View Leaderboard</Link>
        <p>{timestamp?.toDate().toLocaleDateString()}</p>
      </div>
    </div>
  );
};

export default PuzzleCard;
