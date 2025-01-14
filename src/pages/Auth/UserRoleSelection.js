import React, { useState, useEffect } from 'react';
import './UserRoleSelection.css';
import backgroundImage from '../../assets/love.jpg';
import { Card, Button, Row, Col } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const UserRoleSelection = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  const roles = [
    { id: 'student', label: 'Student', description: 'Click here to log in as a student.' },
    { id: 'donor', label: 'Donor', description: 'Click here to log in as a donor.' },
    { id: 'admin', label: 'Admin', description: 'Click here to log in as an admin.' },
  ];

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
  };

  const handleSignUp = () => {
    if (selectedRole) {
      navigate('/Signup', { state: { role: selectedRole } });
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    const options = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    };
    return date.toLocaleDateString('en-US', options);
  };

  return (
    <div className="user-role-container">
      <div
        className="background-section"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center center',
          backgroundSize: 'cover',
        }}
      >
        <div className="overlay-text">
          <h1>Give Hope, Give Opportunity</h1>
          <h2>Donate to Support Student Success</h2>
        </div>
      </div>

      {/* Updated Top Bar */}
      <div className="top-bar">
        <div className="system-name">USM AidVantage System</div>
        <div className="current-time">{formatDate(currentTime)}</div>
      </div>

      <div className="content-wrapper">
        <div className="content">
          <div className="welcome-message">
            <h2>Welcome to USM AidVantage</h2>
            <p>Select your user type before getting started.</p>
          </div>

          <Row gutter={[16, 16]} justify="center">
            {roles.map((role) => (
              <Col span={8} key={role.id}>
                <Card
                  hoverable
                  className={`role-card ${selectedRole === role.id ? 'selected' : ''}`}
                  onClick={() => handleRoleSelect(role.id)}
                >
                  <Card.Meta title={role.label} description={role.description} />
                  {selectedRole === role.id && (
                    <div className="selected-tick">
                      <CheckCircleOutlined style={{ color: 'green', fontSize: '20px' }} />
                    </div>
                  )}
                </Card>
              </Col>
            ))}
          </Row>

          <div className="navigation-buttons">
            <Button
              className="btn-login"
              type="primary"
              size="large"
              disabled={!selectedRole}
              onClick={handleSignUp}
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>

      {/* Updated Bottom Bar */}
      <div className="bottom-bar">
        <p>© 2024 USM AidVantage Portal | Universiti Sains Malaysia</p>
      </div>
    </div>
  );
};

export default UserRoleSelection;