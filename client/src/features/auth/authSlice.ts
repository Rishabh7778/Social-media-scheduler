import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import API from '../../services/api';

// 1. Types Define Karo (🚨 provider add kiya)
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  provider?: string; // 👈 YE ADD KIYA HAI
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

// 2. Initial State
const initialState: AuthState = {
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token') || null,
  isLoading: false,
  error: null,
};

// ... (Baaki saare Thunks jaise registerUser, loginUser, logoutUser ekdum SAME rahenge) ...
export const registerUser = createAsyncThunk('auth/register', async (formData: any, { rejectWithValue }) => {
  try {
    const response = await API.post('/auth/register', formData);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Registration failed');
  }
});

export const loginUser = createAsyncThunk('auth/login', async (formData: any, { rejectWithValue }) => {
  try {
    const response = await API.post('/auth/login', formData);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Login failed');
  }
});

export const fetchUserData = createAsyncThunk('auth/userData', async (_, { getState, rejectWithValue }) => {
  try {
    const state = getState() as { auth: AuthState };
    const token = state.auth.token;
    if (!token) throw new Error('No token found');
    const response = await API.get('/auth/userData', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch user data');
  }
});

export const logoutUser = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    const response = await API.post('/auth/logout');
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Logout failed');
  }
});

// 4. Slice Banana
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // --- Login Lifecycle ---
    builder.addCase(loginUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
      state.user = action.payload.user; // Isme ab provider bhi aayega token se
      state.token = action.payload.token;
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    });
    builder.addCase(loginUser.rejected, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    // --- Fetch User Data Lifecycle ---
    builder.addCase(fetchUserData.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchUserData.fulfilled, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
      state.user = action.payload;
    });
    builder.addCase(fetchUserData.rejected, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    // --- Logout Lifecycle ---
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    });
    builder.addCase(logoutUser.rejected, (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    });
  },
});

export default authSlice.reducer;