import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const Profile = () => {
  const { user, logout, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="registration-page">
        <div className="registration-container">
          <div className="registration-card">
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="registration-page">
        <div className="registration-container">
          <div className="registration-card">
            <h1>Access Denied</h1>
            <p style={{ textAlign: 'center', marginBottom: '2rem', color: '#64748b' }}>
              Please sign in to access your profile.
            </p>
            <Link to="/login" className="btn-primary">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="registration-page">
      <div className="registration-container">
        <div className="registration-card">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <img 
              src="https://customer-assets.emergentagent.com/job_saas-launchpad/artifacts/oc7u6unx_YEYO%20LOGO.png" 
              alt="YEYO LAB" 
              style={{ height: '40px', marginBottom: '1rem' }}
            />
            <h1>Your Profile</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                {user.picture && (
                  <img 
                    src={user.picture} 
                    alt={user.name}
                    className="w-16 h-16 rounded-full"
                  />
                )}
                <div>
                  <h3 className="text-lg font-semibold">{user.name}</h3>
                  <p className="text-gray-600">{user.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    User Type
                  </label>
                  <p className="text-lg capitalize">
                    <span className="text-green-600">{user.user_type}</span>
                  </p>
                </div>

                {user.company && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company
                    </label>
                    <p className="text-lg">{user.company}</p>
                  </div>
                )}
              </div>

              {user.additional_info && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Information
                  </label>
                  <p className="text-gray-600">{user.additional_info}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Member Since
                </label>
                <p className="text-gray-600">
                  {new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          <div style={{ marginTop: '2rem' }}>
            <Card>
              <CardContent className="pt-4">
                <h3 className="font-semibold mb-2">
                  Update Your Profile
                </h3>
                <p className="text-gray-600 mb-4">
                  Complete or update your profile information.
                </p>
                <div className="flex gap-2">
                  <Link to="/register/investor" className="btn-secondary">
                    Update Investor Profile
                  </Link>
                  <Link to="/register/founder" className="btn-secondary">
                    Update Founder Profile
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/" className="btn-secondary">
              Back to Home
            </Link>
            <Link to="/book-call" className="btn-primary">
              Book a Call
            </Link>
            <Button onClick={handleLogout} variant="outline">
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;