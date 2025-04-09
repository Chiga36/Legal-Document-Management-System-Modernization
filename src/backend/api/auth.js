// src/backend/api/auth.js

const express = require('express');
const User = require('../models/user');
const auth = require('../middleware/auth');
const speakeasy = require('speakeasy');
const { logger } = require('../middleware/logging');

const router = new express.Router();

// User registration
router.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;
    
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send({ error: 'Email already in use' });
    }
    
    // Create new user (default role is 'staff' if not specified)
    const user = new User({
      name,
      email,
      password,
      role: role || 'staff',
      department
    });
    
    await user.save();
    const token = await user.generateAuthToken();
    
    logger.info('User registered', { userId: user._id });
    res.status(201).send({ user, token });
  } catch (error) {
    logger.error('Registration error', { error: error.message });
    res.status(400).send({ error: error.message });
  }
});

// User login
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password, mfaToken } = req.body;
    
    // Find user by credentials
    const user = await User.findByCredentials(email, password);
    
    // Check if MFA is enabled for the user
    if (user.mfaEnabled) {
      // If MFA token not provided in the request
      if (!mfaToken) {
        return res.status(200).send({ 
          requireMfa: true,
          message: 'MFA token required'
        });
      }
      
      // Verify MFA token
      const verified = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token: mfaToken
      });
      
      if (!verified) {
        return res.status(401).send({ error: 'Invalid MFA token' });
      }
    }
    
    // Generate authentication token
    const token = await user.generateAuthToken();
    
    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save();
    
    logger.info('User logged in', { userId: user._id });
    res.send({ user, token });
  } catch (error) {
    logger.error('Login error', { error: error.message });
    res.status(401).send({ error: 'Unable to login' });
  }
});

// User logout (current session)
router.post('/auth/logout', auth, async (req, res) => {
  try {
    // Remove current token
    req.user.tokens = req.user.tokens.filter(token => token.token !== req.token);
    await req.user.save();
    
    logger.info('User logged out', { userId: req.user._id });
    res.send({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error', { userId: req.user?._id, error: error.message });
    res.status(500).send({ error: error.message });
  }
});

// User logout (all sessions)
router.post('/auth/logoutAll', auth, async (req, res) => {
  try {
    // Remove all tokens
    req.user.tokens = [];
    await req.user.save();
    
    logger.info('User logged out from all sessions', { userId: req.user._id });
    res.send({ message: 'Logged out of all sessions' });
  } catch (error) {
    logger.error('Logout all error', { userId: req.user?._id, error: error.message });
    res.status(500).send({ error: error.message });
  }
});

// Password reset request
router.post('/auth/passwordResetRequest', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    // Don't reveal if user exists or not for security
    if (!user) {
      return res.status(200).send({ message: 'If your email is registered, you will receive a password reset link' });
    }
    
    // In a real application, you would generate a token and send an email
    // For this example, we'll just log it
    const resetToken = require('crypto').randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();
    
    logger.info('Password reset requested', { userId: user._id });
    res.status(200).send({ message: 'If your email is registered, you will receive a password reset link' });
  } catch (error) {
    logger.error('Password reset request error', { error: error.message });
    res.status(500).send({ error: 'Server error' });
  }
});

// Password reset
router.post('/auth/passwordReset', async (req, res) => {
  try {
    const { token, password } = req.body;
    
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).send({ error: 'Password reset token is invalid or has expired' });
    }
    
    // Update password and clear reset token
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    
    logger.info('Password reset completed', { userId: user._id });
    res.send({ message: 'Password has been updated' });
  } catch (error) {
    logger.error('Password reset error', { error: error.message });
    res.status(500).send({ error: error.message });
  }
});

module.exports = router;