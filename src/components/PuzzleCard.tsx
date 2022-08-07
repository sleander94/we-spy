import { Link } from 'react-router-dom';
import { PuzzleCardProps } from '../types.d';

const PuzzleCard = ({
  id,
  title,
  author,
  image,
  timestamp,
  likes,
  views,
}: PuzzleCardProps) => {
  return (
    <div className="puzzle">
      <Link className="title" to={`/puzzles/${id}`}>
        {title}
      </Link>
      <a className="thumbnail" href={`/puzzles/${id}`}>
        <img src={image} alt="puzzle thumbnail" />
      </a>
      <Link className="leaderboard-link" to={`/leaderboards/${id}`}>
        View Leaderboard
      </Link>
      <div className="puzzle-info">
        <p>{author.split(' ')[0]}</p>
        <p>{timestamp?.toDate().toLocaleDateString()}</p>
        <p className="views">
          <img
            className="view-icon"
            src={require('../assets/icons/eye-outline.svg').default}
            alt=""
          ></img>
          {views}
        </p>
      </div>
    </div>
  );
};

export default PuzzleCard;
