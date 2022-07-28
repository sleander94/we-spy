import { auth } from '../firebase/client';
import { signInWithRedirect, GoogleAuthProvider, signOut } from 'firebase/auth';
import { NavProps } from '../types.d';

const Navbar = ({ loggedIn, username }: NavProps) => {
  const provider = new GoogleAuthProvider();

  return (
    <nav id="nav">
      <a href="/puzzles">
        <h1>We Spy</h1>
      </a>
      {!loggedIn && (
        <div className="user-actions">
          <button onClick={() => signInWithRedirect(auth, provider)}>
            Login
          </button>
        </div>
      )}
      {loggedIn && (
        <div className="user-actions">
          <p>Hello, {username.split(' ')[0]}</p>
          <a href="/puzzles/new">New Puzzle</a>
          <button onClick={() => signOut(auth)}>Logout</button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
