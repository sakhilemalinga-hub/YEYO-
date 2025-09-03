import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Calendar } from './ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BookingPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Available time slots
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime) {
      toast.error('Please select both date and time');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API}/bookings`, {
        name: formData.name,
        email: formData.email,
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTime,
        message: formData.message
      });

      toast.success('Booking request submitted successfully! We\'ll be in touch soon.');
      
      // Reset form
      setFormData({ name: '', email: '', message: '' });
      setSelectedDate(null);
      setSelectedTime('');
    } catch (error) {
      toast.error('Failed to submit booking. Please try again.');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  // Disable past dates
  const isDateDisabled = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <div className="registration-page">
      <div className="registration-container" style={{ maxWidth: '800px' }}>
        <div className="registration-card">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <img 
              src="https://customer-assets.emergentagent.com/job_saas-launchpad/artifacts/oc7u6unx_YEYO%20LOGO.png" 
              alt="YEYO LAB" 
              style={{ height: '40px', marginBottom: '1rem' }}
            />
            <h1>Book Your 15-Minute Fit Call</h1>
            <p style={{ color: '#64748b' }}>
              Schedule a quick call to discuss how YEYO LAB can help co-found and scale your SaaS venture.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="form-group">
                    <label htmlFor="name">Full Name *</label>
                    <Input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email Address *</label>
                    <Input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email address"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="message">What would you like to discuss? (Optional)</label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us about your startup, stage, or specific questions..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Date Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Select Date</CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={isDateDisabled}
                      className="rounded-md border"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Time Selection */}
              {selectedDate && (
                <Card>
                  <CardHeader>
                    <CardTitle>Select Time (GMT+2)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                      gap: '0.5rem' 
                    }}>
                      {timeSlots.map((time) => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setSelectedTime(time)}
                          className={`p-2 border rounded-md text-sm font-medium transition-colors ${
                            selectedTime === time
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                    {selectedTime && (
                      <p style={{ marginTop: '1rem', color: '#3b82f6', fontWeight: '500' }}>
                        Selected: {selectedDate.toLocaleDateString()} at {selectedTime}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            <Button 
              type="submit" 
              disabled={submitting || !selectedDate || !selectedTime} 
              className="w-full" 
              size="lg"
              style={{ marginTop: '2rem' }}
            >
              {submitting ? 'Booking...' : 'Book My Call'}
            </Button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <p style={{ color: '#64748b', marginBottom: '1rem' }}>
              Questions? Email us at hello@yeyolab.com
            </p>
            <Link to="/" style={{ color: '#3b82f6' }}>← Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;