import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from './store';

export interface User {
  userId: string;
  email: string;
  account: string;
  nickname?: string;
  fullname?: string;
  imageUrl?: string;
  isAdmin?: boolean;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionChecked: boolean;
  error: string | null;
}

const initialState: AuthState = {
  token: localStorage.getItem('access_token'),
  user: null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  isLoading: false,
  sessionChecked: false,
  error: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<{ token: string; user: User }>) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.sessionChecked = true;
      localStorage.setItem('access_token', action.payload.token);
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
      state.error = action.payload;
      state.sessionChecked = true;
      localStorage.removeItem('access_token');
    },
    registerStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    registerSuccess: (state, action: PayloadAction<{ token: string; user: User }>) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.sessionChecked = true;
      localStorage.setItem('access_token', action.payload.token);
    },
    registerFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
      state.error = action.payload;
      state.sessionChecked = true;
      localStorage.removeItem('access_token');
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
      state.error = null;
      state.sessionChecked = true;
      localStorage.removeItem('access_token');
    },
    tokenRefreshed: (state, action: PayloadAction<string>) => {
      state.isAuthenticated = true;
      state.token = action.payload;
      localStorage.setItem('access_token', action.payload);
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    sessionCheckStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    sessionCheckFinished: (state) => {
      state.isLoading = false;
      state.sessionChecked = true;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  registerStart,
  registerSuccess,
  registerFailure,
  logout,
  tokenRefreshed,
  setUser,
  sessionCheckStart,
  sessionCheckFinished,
  clearError,
} = authSlice.actions;

// Selectors
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectAuthToken = (state: RootState) => state.auth.token;
export const selectAuthUser = (state: RootState) => state.auth.user;
export const selectIsAdmin = (state: RootState) => !!state.auth.user?.isAdmin;
export const selectAuthLoading = (state: RootState) => state.auth.isLoading;
export const selectSessionChecked = (state: RootState) => state.auth.sessionChecked;
export const selectAuthError = (state: RootState) => state.auth.error;

export default authSlice.reducer;
