import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from '../utils/toast';
import { FaUser, FaClipboardList, FaMapMarkerAlt, FaCog } from 'react-icons/fa';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    userType: 'standard',
    emailNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
    profileVisibility: 'public',
    showContactInfo: true,
    showOnlineStatus: true,
    language: 'English',
    currency: 'USD',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    avatar: null,
  });

  // Define the steps of our registration process with enhanced descriptions and icons
  const steps = [
    { id: 1, name: 'Account', description: 'Set up your login details', icon: <FaUser /> },
    { id: 2, name: 'Profile', description: 'Tell us about yourself', icon: <FaClipboardList /> },
    { id: 3, name: 'Address', description: 'Where you\'re located', icon: <FaMapMarkerAlt /> },
    { id: 4, name: 'Preferences', description: 'Customize your experience', icon: <FaCog /> }
  ];

  // Progress percentage calculation
  const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100;

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Move to the next step with validation
  const nextStep = () => {
    // Validate current step
    if (currentStep === 1) {
      if (!formData.username || !formData.email || !formData.password) {
        setError('Please fill in all required fields for this step');
        return;
      }
      
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }
    }

    setError('');
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Move to the previous step
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Final validation
    if (!formData.username || !formData.email || !formData.password) {
      setError('Please fill in all required fields (Username, Email, Password)');
      setCurrentStep(1);
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setCurrentStep(1);
      return;
    }

    setLoading(true);

    try {
      // Prepare complete user data with ALL collected information
      const completeUserData = {
        // Account basics
        username: formData.username,
        email: formData.email,
        password: formData.password,
        
        // Personal information
        fullName: formData.fullName || formData.username,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        
        // Location information
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
        
        // Account settings
        userType: formData.userType,
        emailNotifications: formData.emailNotifications,
        smsNotifications: formData.smsNotifications,
        marketingEmails: formData.marketingEmails,
        profileVisibility: formData.profileVisibility,
        showContactInfo: formData.showContactInfo,
        showOnlineStatus: formData.showOnlineStatus,
        
        // Regional settings
        language: formData.language,
        currency: formData.currency,
        timezone: formData.timezone,

        // Avatar
        avatar: formData.avatar,
      };

      const response = await register(completeUserData);
      const result = response.success;

      if (result) {
        toast.success('Registration successful!');
        navigate('/posts');
      } else {
        // Handle API error or malformed response
        const apiError = (result && result.message) || (response && response.statusText) || 'Registration failed. Please try again.';
        toast.error(apiError);
        setError(apiError);
      }
    } catch (error) {
      toast.error(error.message || 'Registration failed. Please try again.');
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add animation effect when changing steps
  useEffect(() => {
    const formElement = document.querySelector('.form-container');
    if (formElement) {
      formElement.classList.add('fade-in');
      setTimeout(() => {
        formElement.classList.remove('fade-in');
      }, 500);
    }
  }, [currentStep]);

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8" style={{ background: 'var(--bg-main)', color: 'var(--text-main)' }}>
      <div className="max-w-5xl mx-auto">
        {/* Logo and Branding */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: 'var(--theme-accent)' }}>
            PropertyState
          </h1>
          <p className="mt-2 text-lg" style={{ color: 'var(--text-muted)' }}>
            Find your dream property with ease
          </p>
        </div>
        
        <div className="shadow-2xl rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)' }}>
          {/* Header with customized gradient */}
          <div className="py-8 px-8" style={{ background: 'linear-gradient(90deg, var(--theme-accent), var(--hover-theme-accent))' }}>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Create Your Account</h2>
            <p className="mt-2" style={{ color: 'var(--text-light)' }}>Join PropertyState and start exploring properties</p>
            
            {/* Step indicator with percentage */}
            <div className="mt-6">
              <div className="flex justify-between text-white mb-2">
                <span className="text-sm" >Step {currentStep} of {steps.length}</span>
                <span className="text-sm" >{Math.round(progressPercentage)}% Complete</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2.5" style={{ background: 'var(--bg-light-accent, #e0f2fe)' }}>
                <div 
                  className="h-2.5 rounded-full transition-all duration-500 ease-in-out"
                  style={{ width: `${progressPercentage}%`, background: 'var(--hover-theme-accent)' }}
                ></div>
              </div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="px-8 py-6 border-b flex justify-center border-gray-200" style={{ background: 'var(--bg-main)' }}>
            <nav aria-label="Progress">
              <ol className="grid grid-cols-1 sm:grid-cols-4 items-center flex-wrap">
                {steps.map((step, index) => {
                  const isCompleted = currentStep > step.id;
                  const isCurrent = currentStep === step.id;
                  const isUpcoming = currentStep < step.id;
                  // Determine if the connecting line after this step should be filled
                  const nextStepCompleted = currentStep > steps[index]?.id;
                  return (
                    <li key={step.id} className={`${index !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''} relative`}>
                      <div className="flex items-center">
                        <span className={`relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${isCompleted ? 'bg-green-600 group-hover:bg-green-700' : isCurrent ? 'border-2 border-[var(--theme-accent)] bg-white' : 'border-2 border-gray-300 bg-white group-hover:border-gray-400'} transition-colors duration-200`}>
                          <span className={`${isCompleted ? 'text-white' : isCurrent ? 'text-[var(--theme-accent)]' : 'text-gray-500'} text-lg`}>{step.icon}</span>
                          {/* Connecting line */}
                          {index !== steps.length && (
                            <div
                              className="absolute top-5 h-0.5 w-full -translate-y-1/2"
                              style={{
                                width: 'calc(400% + 1.5rem)',
                                right: '50%',
                                background: nextStepCompleted ? 'var(--theme-accent)' : 'var(--text-light)',
                                transition: 'background 0.3s',
                              }}
                            ></div>
                          )}
                        </span>
                        <span className={`ml-3 text-sm font-medium ${isCompleted ? '' : isCurrent ? '' : ''}`} style={{ color: isCompleted ? 'var(--text-main)' : isCurrent ? 'var(--theme-accent)' : 'var(--text-muted)' }}>
                          {step.name}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </nav>
          </div>
          {/* Error Message with improved styling */}
          {error && (
            <div className="mx-8 my-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium" style={{ color: 'var(--text-main)' }}>There was a problem</h3>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{error}</p>
                </div>
              </div>
            </div>
          )}
          {/* Form with smooth transitions */}
          <div className="form-container transition duration-300 ease-in-out">
            <form onSubmit={handleSubmit} className="px-8 py-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                {/* Step 1: Account Information */}
                {currentStep === 1 && (
                  <>
                    <div className="col-span-2 mb-4">
                      <h3 className="text-xl font-semibold border-b border-gray-200 pb-2" style={{ color: 'var(--text-main)' }}>
                        Account Information
                      </h3>
                      <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                        Set up your login details. These credentials will be used to access your account.
                      </p>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label htmlFor="username" className="block text-sm font-medium" style={{ color: 'var(--text-main)' }}>
                        Username <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500">@</span>
                        </div>
                        <input
                          type="text"
                          id="username"
                          name="username"
                          autoComplete="username"
                          value={formData.username}
                          onChange={handleChange}
                          className="pl-8 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-[var(--theme-accent)] sm:text-sm"
                          style={{ background: 'var(--bg-main)', color: 'var(--text-main)', borderColor: 'var(--text-light)' }}
                          required
                          placeholder="johndoe"
                        />
                      </div>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label htmlFor="email" className="block text-sm font-medium" style={{ color: 'var(--text-main)' }}>
                        Email <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <input
                          type="email"
                          id="email"
                          name="email"
                          autoComplete="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-[var(--theme-accent)] sm:text-sm"
                          style={{ background: 'var(--bg-main)', color: 'var(--text-main)', borderColor: 'var(--text-light)' }}
                          required
                          placeholder="you@example.com"
                        />
                      </div>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label htmlFor="password" className="block text-sm font-medium" style={{ color: 'var(--text-main)' }}>
                        Password <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <input
                          type="password"
                          id="password"
                          name="password"
                          autoComplete="new-password"
                          value={formData.password}
                          onChange={handleChange}
                          className="block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-[var(--theme-accent)] sm:text-sm"
                          style={{ background: 'var(--bg-main)', color: 'var(--text-main)', borderColor: 'var(--text-light)' }}
                          required
                        />
                      </div>
                      <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>Must be at least 6 characters</p>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label htmlFor="confirmPassword" className="block text-sm font-medium" style={{ color: 'var(--text-main)' }}>
                        Confirm Password <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <input
                          type="password"
                          id="confirmPassword"
                          name="confirmPassword"
                          autoComplete="new-password"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className="block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-[var(--theme-accent)] sm:text-sm"
                          style={{ background: 'var(--bg-main)', color: 'var(--text-main)', borderColor: 'var(--text-light)' }}
                          required
                        />
                      </div>
                    </div>
                    {/* Password strength indicator */}
                    <div className="col-span-2">
                      <div className="h-1 w-full bg-gray-200 rounded-full mt-2">
                        <div 
                          className={`h-1 rounded-full ${
                            formData.password.length === 0 ? 'bg-gray-200' :
                            formData.password.length < 6 ? 'bg-red-500' :
                            formData.password.length < 10 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(100, formData.password.length * 10)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        {formData.password.length === 0 ? 'Enter a password' :
                         formData.password.length < 6 ? 'Password is too weak' :
                         formData.password.length < 10 ? 'Password strength: Medium' : 'Password strength: Strong'}
                      </p>
                    </div>
                  </>
                )}
                {/* Step 2: Personal Information */}
                {currentStep === 2 && (
                  <>
                    <div className="col-span-2 mb-4">
                      <h3 className="text-xl font-semibold border-b border-gray-200 pb-2" style={{ color: 'var(--text-main)' }}>
                        Personal Information
                      </h3>
                      <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                        Tell us a little about yourself. This information helps us personalize your experience.
                      </p>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label htmlFor="fullName" className="block text-sm font-medium" style={{ color: 'var(--text-main)' }}>
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        autoComplete="name"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="John Doe"
                        className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-[var(--theme-accent)] sm:text-sm"
                        style={{ background: 'var(--bg-main)', color: 'var(--text-main)', borderColor: 'var(--text-light)' }}
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label htmlFor="phone" className="block text-sm font-medium" style={{ color: 'var(--text-main)' }}>
                        Phone
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        autoComplete="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+1 (555) 123-4567"
                        className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-[var(--theme-accent)] sm:text-sm"
                        style={{ background: 'var(--bg-main)', color: 'var(--text-main)', borderColor: 'var(--text-light)' }}
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label htmlFor="dateOfBirth" className="block text-sm font-medium" style={{ color: 'var(--text-main)' }}>
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        id="dateOfBirth"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-[var(--theme-accent)] sm:text-sm"
                        style={{ background: 'var(--bg-main)', color: 'var(--text-main)', borderColor: 'var(--text-light)' }}
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label htmlFor="gender" className="block text-sm font-medium" style={{ color: 'var(--text-main)' }}>
                        Gender
                      </label>
                      <select
                        id="gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-[var(--theme-accent)] sm:text-sm"
                        style={{ background: 'var(--bg-main)', color: 'var(--text-main)', borderColor: 'var(--text-light)' }}
                      >
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer-not-to-say">Prefer not to say</option>
                      </select>
                    </div>
                    {/* Profile picture upload */}
                    <div className="col-span-2 mt-4">
                      <label className="block text-sm font-medium" style={{ color: 'var(--text-main)' }}>Profile Photo</label>
                      <div className="mt-2 flex items-center">
                        <div className="h-20 w-20 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-main)', border: '1px solid var(--text-light)' }}>
                          {formData.avatar ? (
                            <img src={formData.avatar} alt="Avatar Preview" className="h-20 w-20 object-cover rounded-full" />
                          ) : (
                            <svg className="h-12 w-12 block mx-auto my-auto" style={{ color: 'var(--text-light)' }} fill="currentColor" viewBox="0 0 24 24">
                              <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                          )}
                        </div>
                        <label htmlFor="avatar-upload" className="ml-5 py-2 px-3 border rounded-md shadow-sm text-sm leading-4 font-medium cursor-pointer" style={{ background: 'var(--bg-card)', color: 'var(--text-main)', borderColor: 'var(--text-light)', cursor: 'pointer' }}>
                          Upload
                          <input
                            id="avatar-upload"
                            name="avatar"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setFormData(prev => ({ ...prev, avatar: reader.result }));
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        <p className="text-xs ml-3" style={{ color: 'var(--text-muted)' }}>Optional - You can add this later</p>
                      </div>
                    </div>
                  </>
                )}
                {/* Step 3: Address Information */}
                {currentStep === 3 && (
                  <>
                    <div className="col-span-2 mb-4">
                      <h3 className="text-xl font-semibold border-b border-gray-200 pb-2" style={{ color: 'var(--text-main)' }}>
                        Address Information
                      </h3>
                      <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                        Tell us where you&apos;re located. This helps us show you relevant properties in your area.
                      </p>
                    </div>
                    <div className="col-span-2">
                      <label htmlFor="address" className="block text-sm font-medium" style={{ color: 'var(--text-main)' }}>
                        Street Address
                      </label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        autoComplete="street-address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="123 Main Street"
                        className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-[var(--theme-accent)] sm:text-sm"
                        style={{ background: 'var(--bg-main)', color: 'var(--text-main)', borderColor: 'var(--text-light)' }}
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label htmlFor="city" className="block text-sm font-medium" style={{ color: 'var(--text-main)' }}>
                        City
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        autoComplete="address-level2"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="New York"
                        className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-[var(--theme-accent)] sm:text-sm"
                        style={{ background: 'var(--bg-main)', color: 'var(--text-main)', borderColor: 'var(--text-light)' }}
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label htmlFor="state" className="block text-sm font-medium" style={{ color: 'var(--text-main)' }}>
                        State / Province
                      </label>
                      <input
                        type="text"
                        id="state"
                        name="state"
                        autoComplete="address-level1"
                        value={formData.state}
                        onChange={handleChange}
                        placeholder="NY"
                        className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-[var(--theme-accent)] sm:text-sm"
                        style={{ background: 'var(--bg-main)', color: 'var(--text-main)', borderColor: 'var(--text-light)' }}
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label htmlFor="zipCode" className="block text-sm font-medium" style={{ color: 'var(--text-main)' }}>
                        ZIP / Postal Code
                      </label>
                      <input
                        type="text"
                        id="zipCode"
                        name="zipCode"
                        autoComplete="postal-code"
                        value={formData.zipCode}
                        onChange={handleChange}
                        placeholder="10001"
                        className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-[var(--theme-accent)] sm:text-sm"
                        style={{ background: 'var(--bg-main)', color: 'var(--text-main)', borderColor: 'var(--text-light)' }}
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label htmlFor="country" className="block text-sm font-medium" style={{ color: 'var(--text-main)' }}>
                        Country
                      </label>
                      <select
                        id="country"
                        name="country"
                        autoComplete="country"
                        value={formData.country}
                        onChange={handleChange}
                        className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-[var(--theme-accent)] sm:text-sm"
                        style={{ background: 'var(--bg-main)', color: 'var(--text-main)', borderColor: 'var(--text-light)' }}
                      >
                         <option value="India">India</option>
                        <option value="United States">United States</option>
                        <option value="Canada">Canada</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Australia">Australia</option>
                        <option value="Germany">Germany</option>
                        <option value="France">France</option>
                        <option value="Japan">Japan</option>
                      </select>
                    </div>
                    {/* Map visualization placeholder */}
                    <div className="col-span-2 mt-4 border rounded-lg overflow-hidden" style={{ borderColor: 'var(--text-light)' }}>
                      <div className="h-32 sm:h-56 flex items-center justify-center" style={{ background: 'var(--bg-main)' }}>
                        <div className="text-center" style={{ color: 'var(--text-light)' }}>
                          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true" style={{ color: 'var(--text-light)' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <p className="mt-1">Map preview will appear here</p>
                          <p className="text-xs">Enter your address to see it on the map</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                {/* Step 4: Preferences & Settings */}
                {currentStep === 4 && (
                  <>
                    <div className="col-span-2 mb-4">
                      <h3 className="text-xl font-semibold border-b border-gray-200 pb-2" style={{ color: 'var(--text-main)' }}>
                        Preferences & Settings
                      </h3>
                      <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                        Customize how you want to use PropertyState. You can change these settings anytime.
                      </p>
                    </div>
                    {/* Prevent Enter key from submitting form in Step 4 */}
                    <div onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }} className="contents">
                      <div className="col-span-2 sm:col-span-1">
                        <label htmlFor="userType" className="block text-sm font-medium" style={{ color: 'var(--text-main)' }}>
                          Account Type
                        </label>
                        <div className="mt-1">
                          <select
                            id="userType"
                            name="userType"
                            value={formData.userType}
                            onChange={handleChange}
                            className="block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-[var(--theme-accent)] sm:text-sm"
                            style={{ background: 'var(--bg-main)', color: 'var(--text-main)', borderColor: 'var(--text-light)' }}
                          >
                            <option value="standard">Standard - Free Account</option>
                            <option value="premium">Premium - $9.99/month</option>
                            <option value="agent">Real Estate Agent - $19.99/month</option>
                            <option value="landlord">Property Owner - $14.99/month</option>
                          </select>
                        </div>
                        <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>You can upgrade your account anytime</p>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label htmlFor="language" className="block text-sm font-medium" style={{ color: 'var(--text-main)' }}>
                          Preferred Language
                        </label>
                        <div className="mt-1 relative">
                          <select
                            id="language"
                            name="language"
                            value={formData.language}
                            onChange={handleChange}
                            className="block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-[var(--theme-accent)] sm:text-sm"
                            style={{ background: 'var(--bg-main)', color: 'var(--text-main)', borderColor: 'var(--text-light)' }}
                          >
                            <option value="English">English (US)</option>
                            <option value="Spanish">Español (Spanish)</option>
                            <option value="French">Français (French)</option>
                            <option value="German">Deutsch (German)</option>
                            <option value="Chinese">中文 (Chinese)</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label htmlFor="currency" className="block text-sm font-medium" style={{ color: 'var(--text-main)' }}>
                          Preferred Currency
                        </label>
                        <div className="mt-1 relative">
                          <select
                            id="currency"
                            name="currency"
                            value={formData.currency}
                            onChange={handleChange}
                            className="block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-[var(--theme-accent)] sm:text-sm"
                            style={{ background: 'var(--bg-main)', color: 'var(--text-main)', borderColor: 'var(--text-light)' }}
                          >
                            <option value="USD">$ - US Dollar (USD)</option>
                            <option value="EUR">€ - Euro (EUR)</option>
                            <option value="GBP">£ - British Pound (GBP)</option>
                            <option value="JPY">¥ - Japanese Yen (JPY)</option>
                            <option value="CAD">C$ - Canadian Dollar (CAD)</option>
                            <option value="AUD">A$ - Australian Dollar (AUD)</option>
                            <option value="INR">₹ - Indian Rupee (INR)</option>
                          </select>
                        </div>
                      </div>
                      {/* Notification Settings with toggles */}
                      <div className="col-span-2 p-4 rounded-lg mt-4" style={{ background: 'var(--bg-card)' }}>
                        <fieldset>
                          <legend className="text-base font-medium mb-4" style={{ color: 'var(--text-main)' }}>Communication Preferences</legend>
                          <div className="space-y-4">
                            <div className="relative flex items-start">
                              <div className="flex items-center h-5">
                                <input
                                  id="emailNotifications"
                                  name="emailNotifications"
                                  type="checkbox"
                                  checked={formData.emailNotifications}
                                  onChange={handleChange}
                                  className="h-4 w-4 rounded focus:ring-2 focus:ring-[var(--theme-accent)]"
                                  style={{ accentColor: 'var(--theme-accent)' }}
                                />
                              </div>
                              <div className="ml-3 text-sm">
                                <label htmlFor="emailNotifications" className="font-medium" style={{ color: 'var(--text-main)' }}>
                                  Email Notifications
                                </label>
                                <p style={{ color: 'var(--text-muted)' }}>Get notified about new listings and inquiries</p>
                              </div>
                            </div>
                            <div className="relative flex items-start">
                              <div className="flex items-center h-5">
                                <input
                                  id="smsNotifications"
                                  name="smsNotifications"
                                  type="checkbox"
                                  checked={formData.smsNotifications}
                                  onChange={handleChange}
                                  className="h-4 w-4 rounded focus:ring-2 focus:ring-[var(--theme-accent)]"
                                  style={{ accentColor: 'var(--theme-accent)' }}
                                />
                              </div>
                              <div className="ml-3 text-sm">
                                <label htmlFor="smsNotifications" className="font-medium" style={{ color: 'var(--text-main)' }}>
                                  SMS Notifications
                                </label>
                                <p style={{ color: 'var(--text-muted)' }}>Receive text messages for important updates</p>
                              </div>
                            </div>
                            <div className="relative flex items-start">
                              <div className="flex items-center h-5">
                                <input
                                  id="marketingEmails"
                                  name="marketingEmails"
                                  type="checkbox"
                                  checked={formData.marketingEmails}
                                  onChange={handleChange}
                                  className="h-4 w-4 rounded focus:ring-2 focus:ring-[var(--theme-accent)]"
                                  style={{ accentColor: 'var(--theme-accent)' }}
                                />
                              </div>
                              <div className="ml-3 text-sm">
                                <label htmlFor="marketingEmails" className="font-medium" style={{ color: 'var(--text-main)' }}>
                                  Marketing Communications
                                </label>
                                <p style={{ color: 'var(--text-muted)' }}>Receive special offers and promotions</p>
                              </div>
                            </div>
                          </div>
                        </fieldset>
                      </div>
                      <div className="col-span-2 p-4 rounded-lg mt-4" style={{ background: 'var(--bg-card)' }}>
                        <fieldset>
                          <legend className="text-base font-medium mb-4" style={{ color: 'var(--text-main)' }}>Privacy Settings</legend>
                          <div className="space-y-4">
                            <div className="relative flex items-start">
                              <div className="flex items-center h-5">
                                <input
                                  id="showContactInfo"
                                  name="showContactInfo"
                                  type="checkbox"
                                  checked={formData.showContactInfo}
                                  onChange={handleChange}
                                  className="h-4 w-4 rounded focus:ring-2 focus:ring-[var(--theme-accent)]"
                                  style={{ accentColor: 'var(--theme-accent)' }}
                                />
                              </div>
                              <div className="ml-3 text-sm">
                                <label htmlFor="showContactInfo" className="font-medium" style={{ color: 'var(--text-main)' }}>
                                  Show Contact Information
                                </label>
                                <p style={{ color: 'var(--text-muted)' }}>Display your contact details on your profile</p>
                              </div>
                            </div>
                            <div className="relative flex items-start">
                              <div className="flex items-center h-5">
                                <input
                                  id="showOnlineStatus"
                                  name="showOnlineStatus"
                                  type="checkbox"
                                  checked={formData.showOnlineStatus}
                                  onChange={handleChange}
                                  className="h-4 w-4 rounded focus:ring-2 focus:ring-[var(--theme-accent)]"
                                  style={{ accentColor: 'var(--theme-accent)' }}
                                />
                              </div>
                              <div className="ml-3 text-sm">
                                <label htmlFor="showOnlineStatus" className="font-medium" style={{ color: 'var(--text-main)' }}>
                                  Show Online Status
                                </label>
                                <p style={{ color: 'var(--text-muted)' }}>Let others know when you're active</p>
                              </div>
                            </div>
                          </div>
                        </fieldset>
                      </div>
                      {/* Terms and Conditions with enhanced styling */}
                      <div className="col-span-2 mt-8 p-5 rounded-lg border" style={{ background: 'var(--bg-main)', borderColor: 'var(--theme-accent)' }}>
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <svg className="h-6 w-6" style={{ color: 'var(--theme-accent)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium" style={{ color: 'var(--theme-accent)' }}>Terms and Conditions</h3>
                            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
                              By creating an account, you agree to PropertyState&apos;s{' '}
                              <a href="#terms" className="underline font-medium" style={{ color: 'var(--theme-accent)' }}>Terms of Service</a>{' '}
                              and{' '}
                              <a href="#privacy" className="underline font-medium" style={{ color: 'var(--theme-accent)' }}>Privacy Policy</a>.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              {/* Navigation Buttons with improved styling */}
              <div className="mt-10 pt-5 border-t border-gray-200 flex items-center justify-between">
                <div>
                  {currentStep > 1 ? (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium"
                      style={{ color: 'var(--text-main)', background: 'var(--bg-card)', borderColor: 'var(--text-light)', cursor: 'pointer' }}
                    >
                      <svg className="-ml-1 mr-2 h-5 w-5" style={{ color: 'var(--text-muted)' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Back
                    </button>
                  ) : (
                    <Link to="/login" className="inline-flex items-center text-sm font-medium" style={{ color: 'var(--theme-accent)', cursor: 'pointer' }}>
                      <svg className="-ml-1 mr-1 h-5 w-5" style={{ color: 'var(--theme-accent)' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                      Already have an account? Log in
                    </Link>
                  )}
                </div>
                <div>
                  {currentStep < steps.length ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="inline-flex items-center px-5 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium"
                      style={{ background: 'var(--theme-accent)', color: 'white', cursor: 'pointer' }}
                    >
                      Continue to {steps[currentStep].name}
                      <svg className="-mr-1 ml-2 h-5 w-5" style={{ color: 'white' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  ) : null}
                  {currentStep === steps.length && (
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex justify-center py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium"
                      style={{ background: loading ? 'var(--text-muted)' : 'var(--theme-accent)', color: 'white', cursor: loading ? 'not-allowed' : 'pointer' }}
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5" style={{ color: 'white' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating Your Account...
                        </>
                      ) : 'Complete Registration'}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
        {/* Footer with trust signals */}
        <div className="mt-10 text-center">
          <div className="flex justify-center space-x-6 mb-4">
            <div className="flex items-center" style={{ color: 'var(--text-muted)' }}>
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-xs">Secure Registration</span>
            </div>
            <div className="flex items-center" style={{ color: 'var(--text-muted)' }}>
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-xs">Privacy Protected</span>
            </div>
            <div className="flex items-center" style={{ color: 'var(--text-muted)' }}>
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-xs">Fast & Easy</span>
            </div>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} PropertyState. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
