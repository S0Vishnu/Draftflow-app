
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import logoFull from '../assets/logo_full.svg';
import './AuthShared.css';

const OTPVerification = () => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isResending, setIsResending] = useState(false);
    // Explicitly type the ref array
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const navigate = useNavigate();
    const location = useLocation();

    // Get email from navigation state or fallback
    const userEmail = location.state?.email || "user@example.com";

    useEffect(() => {
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const value = e.target.value;
        if (isNaN(Number(value))) return;

        const newOtp = [...otp];
        // Allow only one character
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);

        // Move to next input if value is entered
        if (value && index < 5 && inputRefs.current[index + 1]) {
            inputRefs.current[index + 1]?.focus();
        }

        // Check if complete (just for demo)
        const combinedOtp = newOtp.join('');
        if (combinedOtp.length === 6 && newOtp.every(v => v !== '')) {
            console.log("OTP Complete:", combinedOtp);
            if (combinedOtp === '111111') {
                navigate('/home');
            } else {
                // For demo purposes, maybe just log or alert, but user asked for static 111111 to move home
                console.log("Invalid OTP");
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
            // Move to previous input on backspace if current is empty
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').trim();
        if (!pastedData || isNaN(Number(pastedData))) return;

        const digits = pastedData.slice(0, 6).split('');
        const newOtp = [...otp];

        digits.forEach((digit: string, i: number) => {
            if (i < 6) newOtp[i] = digit;
        });

        setOtp(newOtp);

        // Focus the input after the pasted part
        const nextFocusIndex = Math.min(digits.length, 5);
        if (inputRefs.current[nextFocusIndex]) {
            inputRefs.current[nextFocusIndex]?.focus();
        }

        // Check if complete
        const combinedOtp = newOtp.join('');
        if (combinedOtp.length === 6 && newOtp.every(v => v !== '')) {
            console.log("OTP Complete (Paste):", combinedOtp);
            if (combinedOtp === '111111') {
                navigate('/home');
            }
        }
    };

    const handleResend = () => {
        setIsResending(true);
        setTimeout(() => {
            setIsResending(false);
        }, 3000);
    };

    return (
        <div className="login-container">
            <button
                onClick={() => navigate('/')}
                style={{
                    position: 'absolute',
                    top: '40px',
                    left: '40px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    zIndex: 10,
                    transition: 'color 0.2s'
                }}
                className="back-btn"
            >
                <ArrowLeft size={20} />
                <span>Back</span>
            </button>

            <div className="login-card" style={{ position: 'relative' }}>


                <div className="brand-header">
                    <img src={logoFull} alt="DRAFTFLOW" className="brand-logo-img" />
                </div>

                <h2 style={{ color: 'white', margin: '0 0 10px 0', fontSize: '20px', fontWeight: '600' }}>Check your email</h2>
                <p className="login-subtitle" style={{ marginBottom: '30px', lineHeight: '1.5' }}>
                    We sent you a sign-in code to: <span style={{ color: 'white' }}>{userEmail}</span><br />
                    Paste (or type) it below to continue.
                </p>

                <div className="otp-group">
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(e, index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            onPaste={handlePaste}
                            ref={(el) => { inputRefs.current[index] = el; }}
                            className="otp-input"
                        />
                    ))}
                </div>

                <button className="resend-btn" onClick={handleResend} disabled={isResending}>
                    Resend Code
                </button>
            </div>

            <div className={`toast ${isResending ? 'visible' : ''}`}>
                <div className="spinner"></div>
                <span>Sending Code</span>
            </div>
        </div>
    );
};

export default OTPVerification;
