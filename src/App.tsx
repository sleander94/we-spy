import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { auth } from './firebase/client';
import { onAuthStateChanged } from 'firebase/auth';
import PuzzleForm from './components/PuzzleForm';
import Puzzles from './components/Puzzles';
import PuzzlePage from './components/PuzzlePage';
import Navbar from './components/Navbar';
import LeaderboardPage from './components/LeaderboardPage';
import UserPuzzles from './components/UserPuzzles';
import './styles/main.css';

const App = () => {
  const [username, setUsername] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [loggedIn, setLoggedIn] = useState<boolean>(true);

  onAuthStateChanged(auth, (user) => {
    if (user) {
      if (user.displayName) setUsername(user.displayName);
      if (user.uid) setUserId(user.uid);
      setLoggedIn(true);
    } else {
      setLoggedIn(false);
    }
  });

  return (
    <div className="App">
      <Navbar loggedIn={loggedIn} username={username} userId={userId} />
      <Router>
        <Routes>
          <Route path="/puzzles" element={<Puzzles />} />
          <Route
            path="/puzzles/:id"
            element={
              <PuzzlePage
                loggedIn={loggedIn}
                username={username}
                userId={userId}
              />
            }
          />
          <Route path="/leaderboards/:id" element={<LeaderboardPage />} />
          <Route
            path="/puzzles/new"
            element={
              <PuzzleForm
                loggedIn={loggedIn}
                username={username}
                userId={userId}
              />
            }
          />
          <Route
            path="/users/:id/puzzles"
            element={
              <UserPuzzles
                loggedIn={loggedIn}
                username={username}
                userId={userId}
              />
            }
          />
        </Routes>
      </Router>
    </div>
  );
};

export default App;
