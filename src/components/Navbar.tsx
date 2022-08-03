import { auth } from '../firebase/client';
import { signInWithRedirect, GoogleAuthProvider, signOut } from 'firebase/auth';
import { UserProps } from '../types.d';

const Navbar = ({ loggedIn, username, userId }: UserProps) => {
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
          {username.length > 0 && <p>Hello, {username.split(' ')[0]}</p>}
          <a href="/puzzles/new">New Puzzle</a>
          <a href={`/users/${userId}/puzzles`}>My Puzzles</a>
          <button onClick={() => signOut(auth)}>Logout</button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
