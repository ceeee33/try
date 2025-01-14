import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import app from '../../firebase';
import './Form.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const auth = getAuth(app);
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user;
      
      // Fetch user role from Firestore
      const firestore = getFirestore(app);
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const userRole = userData.role;
        const userName = userData.name;

        // Store all user information in localStorage with correct field names
        localStorage.setItem('userRole', userRole);
        localStorage.setItem('userName', userName);
        localStorage.setItem('userId', user.uid);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userPhone', userData.phone_num || ''); // Changed to match Firestore field name

        if (userRole === 'admin') {
          navigate('/adminDashboard', {
            state: { role: userRole, name: userName },
          });
        } else if (userRole === 'student') {
          navigate('/studentDashboard', {
            state: { role: userRole, name: userName },
          });
        } else if (userRole === 'donor') {
          navigate('/donorDashboard', {
            state: { role: userRole, name: userName },
          });
        } else {
          // Default redirection if role is unknown
          navigate('/dashboard', {
            state: { role: userRole, name: userName },
          });
        }

        // // Navigate to dashboard with state
        // navigate('/dashboard', { 
        //   state: {
        //     role: userRole,
        //     name: userName
        //   }
        // });
        
      } else {
        setError('User data not found');
        alert('User data not found. Please contact support.');
      }
    } catch (err) {
      console.error('Login error:', err.message);
      console.error('Login error details:', err);
      setError('Failed to log in. Please check your credentials.');
      
      // Handle specific error cases
      switch (err.code) {
        case 'auth/wrong-password':
          alert('Incorrect password');
          break;
        case 'auth/user-not-found':
          alert('User not found');
          break;
        case 'auth/invalid-email':
          alert('Invalid email format');
          break;
        default:
          alert('Login failed. Please try again later.');
      }
    }
  };

  return (
    <section>
      <div className="form">
        <h1>Login Page</h1>
        {error && <p className="error-message" style={{ color: 'red' }}>{error}</p>}

        <form onSubmit={handleLogin}>
          <div className="text_area">
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Email"
              className="text_input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="text_area">
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Password"
              className="text_input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <input type="submit" value="LOGIN" className="btn" />
          <a className="link" href="/signup">Sign Up</a>
        </form>
      </div>

      <div className="ocean">
        <div className="wave"></div>
        <div className="wave"></div>
      </div>
    </section>
  );
};

export default Login;