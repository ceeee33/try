import React, { useState } from 'react';
import './Form.css';
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, collection, query, where, getDocs, getFirestore } from 'firebase/firestore';
import { useLocation, useNavigate } from 'react-router-dom';
import app from '../../firebase';

const Signup = () => {

  const location = useLocation();
  const navigate = useNavigate();
  const { role } = location.state || { role: 'student' }; //default student 
  const incomeThreshold = 5249; // b40 max income

  const [formData, setFormData] = useState({
    name: "",
    age: "", 
    email: "",
    phoneNum: "",
    matric: "",
    // branch: "",
    // schoolStudy: "",
    // yearStudy: "",
    password: "",
    confirmPassword: "",
  })
 
  const [pwdCheck, setPwdCheck] = useState({
    minLength: false,
    hasUpCase: false,
    hasLowCase: false,
    hasNum: false,
  });
  const [errors, setErrors] = useState({
    name: "",
    age: "", //Nid change to date of birth ma
    email: "",
    phoneNum: "",
    matric: "",
    // branch: "",
    // schoolStudy: "",
    // yearStudy: "",
    password: "",
    confirmPassword: "",
  });

  const placeholders = {
    name: 'Enter your full name',
    email: 'Enter your email address',
    phoneNum: 'Enter your phone number',
    age: 'Enter your age',
    matric: 'Enter your matric number',
    // branch: 'Select your branch of study',
    // schoolStudy: 'Enter your school of study',
    // yearStudy: 'Enter your year of study',
    password: 'Create a strong password',
    confirmPassword: 'Re-enter your password for confirmation',
  };

  const validateField = (field, errorMessage) => {
    if (!field) return errorMessage;
    return '';
  };
  
  const validateEmail = (email) => {
    if (!email) return 'Email is required!';
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(email)) return 'Invalid email format!';
    if (role === 'student' && !email.endsWith('@student.usm.my')) {
      return 'Please use a valid student email address ending with @student.usm.my';
    }
    return '';
  };

  // Function to validate password
  const validatePassword = (password) => {
    const lengthCheck = password.length >= 8;
    const uppercaseCheck = /[A-Z]/.test(password);
    const lowercaseCheck = /[a-z]/.test(password);
    const numberCheck = /[0-9]/.test(password);

    setPwdCheck([lengthCheck, uppercaseCheck, lowercaseCheck, numberCheck]);
  };

  const checkStudentEligibility = async (matric, email) => {
    try {
      const firestore = getFirestore(app);
      const studentsRef = collection(firestore, 'students');
      const q = query(studentsRef, 
        where('matricNo', '==', matric),
        where('email', '==', email)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const studentDoc = querySnapshot.docs[0];
        const studentData = studentDoc.data();
        
        if (studentData.totalHouseholdIncome <= incomeThreshold) {
          return { isEligible: true, studentData };
        } else {
          return { 
            isEligible: false, 
            error: `Your household income (${studentData.totalHouseholdIncome}) exceeds the eligibility criteria (${incomeThreshold}).`
          };
        }
      }
      return { 
        isEligible: false, 
        error: 'Student information not found. Please ensure both your matric number and USM email are correct.'
      };
    } catch (err) {
      console.error('Error checking student eligibility:', err);
      throw new Error('Failed to verify student eligibility.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({ ...prevState, [name]: value }));

    if (name === 'password') {
      validatePassword(value);
    }
  };

  // Handle form submission
  const handleSubmit = async(e) => {

    e.preventDefault();

    // let formValid = true;
    let newErrors = { ...errors };

    // const newErrors = {};
    const { name, age, phoneNum, matric, email, password, confirmPassword } = formData;


    newErrors.name = validateField(name, 'Name is required!');
    newErrors.age = isNaN(age) ? 'Age must be a number!' : validateField(age, 'Age is required!');
    newErrors.email = validateEmail(email, 'Email is required!');
    newErrors.phoneNum = validateField(phoneNum, 'Phone number is required!');
    newErrors.password = Object.values(pwdCheck).some((check) => !check)
      ? 'Password must meet all requirements!'
      : validateField(password, 'Password is required!');
    newErrors.confirmPassword = password !== confirmPassword ? 'Passwords do not match!' : validateField(confirmPassword, 'Retype your password!');
    if (role === 'student') {
      // newErrors.branch = validateField(branch, 'Branch is required!');
      // newErrors.schoolStudy = validateField(schoolStudy, 'School of study is required!');
      // newErrors.yearStudy = validateField(yearStudy, 'Year of study is required!');
      newErrors.matric = validateField(matric, 'Matric number is required!');

      try {
        const eligibilityCheck = await checkStudentEligibility(matric,email);
        if (!eligibilityCheck.isEligible) {
          alert(eligibilityCheck.error);
          return;
        }
      } catch (err) {
        alert('Error during eligibility check. Please try again.');
        return;
      }
    }

    setErrors(newErrors);

    if (Object.values(newErrors).some((error) => error)) return;

    console.log('no error');

    try {
      // Create a new user with email and password
      const auth = getAuth(app);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firestore = getFirestore(app);
      const user = userCredential.user;

      await setDoc(doc(firestore, 'users', user.uid), {
        name: name,
        password: password,   
        age: age,
        phone_num: phoneNum,
        email: email,
        role: role,
        createdAt: new Date(),

        ...(role === 'student' && {
          // year: yearStudy,
          // school: schoolStudy,
          // branch: branch,
          matric_num: matric
        })
      });

      console.log('Set doc');

      console.log('Form submitted:', formData);
      console.log('User signed up successfully');
      alert('Account created successfully!');

      navigate('/Login');

      }catch(err) {
        alert('Signup failed. Please try again');
        console.error('Error signing up:', err.message);

      }
  };

  return (
    <section>

    <div className = "form">
      <h1>Signup Page</h1>
      <h2>{role}</h2>
      <p>Signup functionality will go here.</p>
      <form onSubmit={handleSubmit}>
      <h4>Enter your details here:</h4>
        {['name', 'email', 'age', 'phoneNum'].map((field) => (
          <div className="text_area" key={field}>
            <input
              type='text'
              name={field}
              id={field}
              placeholder={placeholders[field]}
              className="text_input"
              value={formData[field] || ''}
              onChange={handleInputChange}
              style={{ borderColor: errors[field] ? 'red' : '' }}
            />
            {errors[field] && <div style={{ color: 'red' }}>{errors[field]}</div>}
          </div>
        ))}

          {role === 'student' && (
            <div className="text_area">
              <input
                type='text'
                name="matric"
                id="matric"
                placeholder={placeholders.matric}
                className="text_input"
                value={formData.matric || ''}
                onChange={handleInputChange}
                style={{ borderColor: errors.matric ? 'red' : '' }}
              />
              {errors.matric && <div style={{ color: 'red' }}>{errors.matric}</div>}
            </div>
          )}

          <div className="text_area">
            <input
              type="password"
              name="password"
              id="password"
              placeholder={placeholders.password}
              className="text_input"
              value={formData.password || ''}
              onChange={handleInputChange}
              style={{ borderColor: errors.password ? 'red' : '' }}
            />
            {errors.password && <div style={{ color: 'red' }}>{errors.password}</div>}
          </div>

          {/* Password strength requirements */}
          <div style={{marginTop: '20px'}}>
            <p>Password must include:</p>
            <ul>
              {['At least 8 characters', 'One uppercase letter', 'One lowercase letter', 'One number'].map(
                (req, idx) => (
                  <li key={idx} style={{ color: pwdCheck[idx] ? 'green' : 'red' }}>
                    {pwdCheck[idx] ? '✔' : '✘'} {req}
                  </li>
                )
              )}
            </ul>
          </div>
          
          <div className="text_area">
            <input
              type="password"
              name="confirmPassword"
              id="confirmPassword"
              placeholder={placeholders.confirmPassword}
              className="text_input"
              value={formData.confirmPassword || ''}
              onChange={handleInputChange}
              style={{ borderColor: errors.confirmPassword ? 'red' : '' }}
            />
            {errors.confirmPassword && <div style={{ color: 'red' }}>{errors.confirmPassword}</div>}
          </div>

          <button className="btn" onClick={handleSubmit}>Submit</button>

    

    <a className="link" href="/login">Already have an account? Login</a>
    </form>
    </div>
    

    <div className="ocean">
      <div className="wave"></div>
      <div className="wave"></div>
    </div>
    </section>
  );
};

export default Signup;

