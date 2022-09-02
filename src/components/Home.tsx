import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <section id="home">
      <h1>Welcome to We Spy</h1>
      <h2>How to Play</h2>
      <div className="left-instruction">
        <img src={require('../assets/images/all-puzzles.webp')} alt="" />
        <p>1. Select a puzzle to start playing.</p>
      </div>
      <div className="right-instruction">
        <p>2. Find all the hidden items to complete the puzzle.</p>
        <img src={require('../assets/images/puzzle-page.webp')} alt="" />
      </div>
      <div className="left-instruction">
        <img src={require('../assets/images/selector-demo.gif')} alt="" />
        <p>3. Click on an item and select it from the list.</p>
      </div>
      <div className="right-instruction">
        <p>4. Find all the items and share your score!</p>
        <img src={require('../assets/images/leaderboard-page.webp')} alt="" />
      </div>
      <Link to={'/puzzles'}>View Puzzles</Link>
    </section>
  );
};

export default Home;
