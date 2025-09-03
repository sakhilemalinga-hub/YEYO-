import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EmailGateModal = ({ isOpen, onOpenChange }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post(`${API}/email-subscribe`, { email });
      toast.success(response.data.message);
      onOpenChange(false);
      setEmail('');
      
      // Trigger download (placeholder for now)
      window.open(response.data.download_url, '_blank');
    } catch (error) {
      toast.error('Failed to process request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Download the 1-Page Thesis</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Processing...' : 'Get Free Download'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const LandingPage = () => {
  const { user, login } = useContext(AuthContext);
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <img 
            src="https://customer-assets.emergentagent.com/job_saas-launchpad/artifacts/oc7u6unx_YEYO%20LOGO.png" 
            alt="YEYO LAB" 
            className="logo"
          />
          <div className="nav-buttons">
            {user ? (
              <>
                <Link to="/profile" className="btn-secondary">Profile</Link>
                {user.user_type === 'pending' && (
                  <>
                    <Link to="/register/investor" className="btn-primary">Complete Registration</Link>
                  </>
                )}
              </>
            ) : (
              <>
                <button onClick={login} className="btn-secondary">Sign In</button>
                <Link to="/register/investor" className="btn-primary">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1>
              The <span className="highlight">YEYO LAB</span> for SaaS Founders
            </h1>
            <p>
              Co-founding and scaling AI-SaaS companies from zero to Series-A in 24 months.
            </p>
            <div className="hero-buttons">
              <Link to="/book-call" className="btn-primary">
                Book My 15-Minute Fit Call →
              </Link>
              <button 
                onClick={() => setEmailModalOpen(true)}
                className="btn-secondary"
              >
                Download the 1-Page Thesis →
              </button>
            </div>
          </div>
          <div className="hero-image">
            <img 
              src="https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzB8MHwxfHNlYXJjaHwxfHxjb2xsYWJvcmF0aW9ufGVufDB8fHx8MTc1Njg5NjQ0M3ww&ixlib=rb-4.1.0&q=85" 
              alt="Professional collaboration"
            />
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <div className="stats-bar">
        <p><strong>Backed by 20+ investors</strong> • <strong>9 design partners</strong> • <strong>3 studio ventures in build</strong></p>
      </div>

      {/* Process Section */}
      <section className="process-section">
        <div className="section-container">
          <h2 className="section-title">Transforming ideas into Series-A companies</h2>
          <div className="process-steps">
            <div className="process-step">
              <div className="step-number">1</div>
              <h3>LAB Entry</h3>
              <p>
                We acquire or co-found SaaS companies with founders who bring domain insight and grit.
                <br /><br />
                <strong>Assets &lt;$1M ARR | Founders with insider knowledge</strong>
              </p>
            </div>
            <div className="process-step">
              <div className="step-number">2</div>
              <h3>Studio Build Sprint (6 Weeks)</h3>
              <p>
                Validate traction fast—$5k MRR or 100 users—or we stop. No wasted years.
              </p>
            </div>
            <div className="process-step">
              <div className="step-number">3</div>
              <h3>LAB Pods</h3>
              <p>
                Shared DevOps • RevOps • Fundraising Pods.
                <br />
                We scale to Series-A at 8–12× ARR.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <div className="section-container">
          <h2 className="section-title">Focused on your startup success</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <h3>Co-Founders on Day One</h3>
              <p>YEYO brings capital, talent, and process.</p>
            </div>
            <div className="benefit-card">
              <h3>35% Lower Burn</h3>
              <p>With our studio infrastructure & South African AI engineers.</p>
            </div>
            <div className="benefit-card">
              <h3>24-Month Path to Series-A</h3>
              <p>Instead of the typical 48 months.</p>
            </div>
            <div className="benefit-card">
              <h3>Investor Upside</h3>
              <p>12J tax wrapper boosts IRR by +30% for SA investors.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Numbers Section */}
      <section className="numbers-section">
        <div className="section-container">
          <h2 className="section-title">Essential metrics for venture success</h2>
          <div className="numbers-grid">
            <div className="number-card">
              <span className="number">$1.5M</span>
              <span className="label">seed capital powering our first ventures</span>
            </div>
            <div className="number-card">
              <span className="number">$75M</span>
              <span className="label">targeting combined exits</span>
            </div>
            <div className="number-card">
              <span className="number">50+</span>
              <span className="label">certified AI engineers in studio talent pool</span>
            </div>
            <div className="number-card">
              <span className="number">3</span>
              <span className="label">SaaS ventures already in diligence</span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="testimonial-section">
        <div className="section-container">
          <div className="testimonial-card">
            <p className="testimonial-quote">
              "YEYO wasn't just an investor—they acted as our co-founding team. They built with us, validated fast, and scaled us to $38k MRR in 5 months. Then they landed our $4M Series-A."
            </p>
            <p className="testimonial-author">— Nomsa M., Co-Founder, FinCheck AI</p>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="cta-section">
        <div className="section-container">
          <h2>Ready to co-found with YEYO?</h2>
          <Link to="/book-call" className="btn-primary">
            Book My 15-Minute Fit Call →
          </Link>
        </div>
      </section>

      <EmailGateModal 
        isOpen={emailModalOpen} 
        onOpenChange={setEmailModalOpen} 
      />
    </div>
  );
};

export default LandingPage;