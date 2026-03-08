import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit'; // Type ko alag se import kiya
import API from '../../services/api';

// 1. Types Define Karo
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

// 2. Initial State (Agar pehle se login hai toh localStorage se nikal lo)
const initialState: AuthState = {
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token') || null,
  isLoading: false,
  error: null,
};

// 3. Async Thunks (API Calls)
export const registerUser = createAsyncThunk('auth/register', async (formData: any, { rejectWithValue }) => {
  try {
    const response = await API.post('/auth/register', formData);
    return response.data; // Backend se aane wala message ya data
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Registration failed');
  }
});

export const loginUser = createAsyncThunk('auth/login', async (formData: any, { rejectWithValue }) => {
  try {
    const response = await API.post('/auth/login', formData);
    return response.data; // { user, token } aayega backend se
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Login failed');
  }
});

// 4. Slice Banana
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Logout ka normal action
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
  },
  extraReducers: (builder) => {
    // Login Lifecycle
    builder.addCase(loginUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
      // LocalStorage mein save karlo taaki refresh par login na hate
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    });
    builder.addCase(loginUser.rejected, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
      state.error = action.payload;
    });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;