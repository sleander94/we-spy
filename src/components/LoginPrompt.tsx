import { auth } from '../firebase/client';
import {
  signInWithRedirect,
  GoogleAuthProvider,
  signInAnonymously,
} from 'firebase/auth';

const LoginPrompt = () => {
  const provider = new GoogleAuthProvider();

  return (
    <section id="login-container">
      <div id="login">
        <h2>Welcome to We Spy! </h2>
        <p>To continue, sign in with an option below.</p>
        <div className="login-buttons">
          <button onClick={() => signInWithRedirect(auth, provider)}>
            Sign In With Google
          </button>
          <button onClick={() => signInAnonymously(auth)}>
            Continue as Guest
          </button>
        </div>
      </div>
    </section>
  );
};

export default LoginPrompt;
