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

// 🚨 1. Create Post (Text + Image)
export const createPost = createAsyncThunk('posts/createPost', async (postData: FormData, { rejectWithValue }) => {
  try {
    const response = await API.post('/posts/createPost', postData); 
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.error || 'Failed to create post');
  }
});

// 🚨 2. Fetch User Posts (GET)
export const fetchUserPosts = createAsyncThunk('posts/fetchUserPosts', async (_, { rejectWithValue }) => {
  try {
    const response = await API.get('/posts/my-posts');
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.error || 'Failed to fetch posts');
  }
});

// 🚨 3. Cancel Scheduled Post (DELETE)
export const cancelPost = createAsyncThunk('posts/cancelPost', async (postId: number, { rejectWithValue }) => {
  try {
    await API.delete(`/posts/cancel-schedule/${postId}`);
    return postId; 
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.error || 'Failed to cancel post');
  }
});

// 🚨 4. Delete Published Post (DELETE Everywhere)
export const deletePost = createAsyncThunk('posts/deletePost', async (postId: number, { rejectWithValue }) => {
  try {
    await API.delete(`/posts/delete/${postId}`);
    return postId;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.error || 'Failed to delete post');
  }
});

// 🚨 5. Reschedule Post (PUT)
export const reschedulePostAPI = createAsyncThunk(
  'posts/reschedulePost',
  async ({ postId, newDate }: { postId: number, newDate: string }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      await API.put(`/posts/reschedule/${postId}`, 
        { newDate }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Seedha wahi data return kar rahe hain jo update hua hai
      return { postId, newDate }; 
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to reschedule');
    }
  }
);

// --- SLICE CREATION ---
const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Posts
      .addCase(fetchUserPosts.pending, (state) => { state.isLoading = true; })
      .addCase(fetchUserPosts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.posts = action.payload;
      })
      .addCase(fetchUserPosts.rejected, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Create Post
      .addCase(createPost.fulfilled, (state, action) => {
        state.isLoading = false;
        state.posts.unshift(action.payload); // Nayi post list mein sabse upar
      })

      // Cancel Post
      .addCase(cancelPost.fulfilled, (state, action: PayloadAction<number>) => {
        state.posts = state.posts.filter(post => post.id !== action.payload);
      })

      // Delete Post
      .addCase(deletePost.fulfilled, (state, action: PayloadAction<number>) => {
        state.posts = state.posts.filter(post => post.id !== action.payload);
      })

      // Reschedule Post (Time Update Logic)
      .addCase(reschedulePostAPI.fulfilled, (state, action) => {
        const { postId, newDate } = action.payload;
        
        // Us post ko state mein dhundo
        const existingPost = state.posts.find(post => post.id === postId);
        
        // Agar mil jaye, toh uska time update kar do
        if (existingPost) {
          existingPost.scheduled_at = newDate;
        }
      });
  },
});

export default postsSlice.reducer;