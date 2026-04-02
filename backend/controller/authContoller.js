import UserModel from '../models/user.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

const sanitizeUser = (userDoc) => ({
  id: userDoc._id,
  name: userDoc.name,
  email: userDoc.email,
  avatar: userDoc.avatar,
  authProvider: userDoc.authProvider,
});

export const signup = async (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  try {
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      if (existingUser.authProvider === 'google') {
        return res.status(400).json({ message: 'Email already linked to a Google account' });
      }
      return res.status(400).json({ message: 'Email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await UserModel.create({
      name,
      email,
      password: hashedPassword,
      authProvider: 'local',
    });

    const token = signToken(newUser._id);
    res.status(201).json({ token, user: sanitizeUser(newUser) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const User = await UserModel.findOne({ email });

    if (!User) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (User.authProvider === 'google' && !User.password) {
      return res.status(400).json({
        message: 'This account uses Google login only',
      });
    }

    const match = await bcrypt.compare(password, User.password);
    if (!match) {
      return res.status(400).json({ message: 'Incorrect password' });
    }

    const token = signToken(User._id);
    res.json({ token, user: sanitizeUser(User) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: 'idToken is required' });

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.sub || !payload?.email) {
      return res.status(401).json({ message: 'Invalid Google account payload' });
    }

    const { sub: googleId, email, name, picture } = payload;

    let User = await UserModel.findOne({ email });
    if (!User) {
      User = await UserModel.create({
        name,
        email,
        googleId,
        avatar: picture,
        authProvider: 'google',
      });
    } else if (User.authProvider === 'google') {
      User.avatar = picture;
      await User.save();
    } else if (User.authProvider === 'local') {
      User.googleId = googleId;
      User.avatar = picture;
      User.authProvider = 'both';
      await User.save();
    }

    const token = signToken(User._id);
    res.json({ token, user: sanitizeUser(User) });
  } catch (err) {
    res.status(401).json({ message: 'Google authentication failed', error: err.message });
  }
};
