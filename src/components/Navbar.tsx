import { auth } from '../firebase/client';
import { signOut } from 'firebase/auth';
import { UserProps } from '../types.d';

const Navbar = ({ loggedIn, username, userId }: UserProps) => {
  return (
    <nav id="nav">
      <a className="title" href="/puzzles">
        <h1>We Spy</h1>
      </a>
      {!loggedIn && (
        <div className="user-actions">
          <button>Log in to continue</button>
        </div>
      )}
      {loggedIn && (
        <div className="user-actions">
          {username.length > 0 && <p>Hello, {username.split(' ')[0]}</p>}
          <a className="home" href="/puzzles">
            All Puzzles
          </a>
          <a href="/puzzles/new">New Puzzle</a>
          <a href={`/users/${userId}/puzzles`}>My Puzzles</a>
          <button onClick={() => signOut(auth)}>Logout</button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
