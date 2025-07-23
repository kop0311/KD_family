import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { pointsAPI } from '../../services/api';

export interface PointsRecord {
  id: number;
  userId: number;
  points: number;
  reason: string;
  taskId?: number;
  awardedBy?: number;
  createdAt: string;
}

export interface LeaderboardEntry {
  userId: number;
  username: string;
  totalPoints: number;
  rank: number;
}

interface PointsState {
  userPoints: number;
  pointsHistory: PointsRecord[];
  leaderboard: LeaderboardEntry[];
  isLoading: boolean;
  error: string | null;
}

const initialState: PointsState = {
  userPoints: 0,
  pointsHistory: [],
  leaderboard: [],
  isLoading: false,
  error: null
};

// Async thunks
export const fetchUserPoints = createAsyncThunk(
  'points/fetchUserPoints',
  async (userId: number | undefined, { rejectWithValue }) => {
    try {
      const response = await pointsAPI.getPoints(userId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch points');
    }
  }
);

export const fetchPointsHistory = createAsyncThunk(
  'points/fetchPointsHistory',
  async (userId: number, { rejectWithValue }) => {
    try {
      const response = await pointsAPI.getPointsHistory(userId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch points history');
    }
  }
);

export const fetchLeaderboard = createAsyncThunk(
  'points/fetchLeaderboard',
  async (period: string | undefined, { rejectWithValue }) => {
    try {
      const response = await pointsAPI.getLeaderboard(period);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch leaderboard');
    }
  }
);

export const awardPoints = createAsyncThunk(
  'points/awardPoints',
  async (data: { userId: number; points: number; reason: string }, { rejectWithValue }) => {
    try {
      const response = await pointsAPI.awardPoints(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to award points');
    }
  }
);

const pointsSlice = createSlice({
  name: 'points',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addPointsRecord: (state, action: PayloadAction<PointsRecord>) => {
      state.pointsHistory.unshift(action.payload);
      state.userPoints += action.payload.points;
    }
  },
  extraReducers: (builder) => {
    // Fetch user points
    builder
      .addCase(fetchUserPoints.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserPoints.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userPoints = action.payload.totalPoints || 0;
      })
      .addCase(fetchUserPoints.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch points history
      .addCase(fetchPointsHistory.fulfilled, (state, action) => {
        state.pointsHistory = action.payload;
      })
      .addCase(fetchPointsHistory.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Fetch leaderboard
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.leaderboard = action.payload;
      })
      .addCase(fetchLeaderboard.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Award points
      .addCase(awardPoints.fulfilled, (state, action) => {
        state.pointsHistory.unshift(action.payload);
        state.userPoints += action.payload.points;
      })
      .addCase(awardPoints.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  }
});

export const { clearError, addPointsRecord } = pointsSlice.actions;
export default pointsSlice.reducer;
