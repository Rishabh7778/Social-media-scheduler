import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import postsReducer from '../features/posts/postSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    posts: postsReducer,
  },
});

// TypeScript ke liye types export karna zaroori hai
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;