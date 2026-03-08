import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import API from '../../services/api';

interface PostState {
  posts: any[];
  isLoading: boolean;
  error: string | null;
}

const initialState: PostState = {
  posts: [],
  isLoading: false,
  error: null,
};

// Async Thunk for creating a post (Text + Image)
export const createPost = createAsyncThunk('posts/createPost', async (postData: FormData, { rejectWithValue }) => {
  try {
    // Axios header mein automatically 'multipart/form-data' set kar dega kyunki hum FormData bhej rahe hain
    const response = await API.post('/posts/createPost', postData); 
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.error || 'Failed to create post');
  }
});

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createPost.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createPost.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        // Nayi post ko state mein add kar do taaki calendar update ho jaye
        state.posts.push(action.payload); 
      })
      .addCase(createPost.rejected, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export default postsSlice.reducer;