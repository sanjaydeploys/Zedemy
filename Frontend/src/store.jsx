import { createStore, applyMiddleware, combineReducers } from 'redux';
import { thunk } from 'redux-thunk';
import postReducer from './reducers/postReducer';
import certificateReducer from './reducers/certificateReducer';
import authReducer from './reducers/authReducer';
import settingsReducer from './reducers/settingsReducer';
import notificationReducer from './reducers/notificationReducer';
import { loadState, saveState } from './utils/localStorage';
import { fetchFollowedCategories } from './actions/notificationActions';
import { loadUser } from './actions/authActions';
import { fetchUserPosts, fetchCompletedPosts } from './actions/postActions';
import { fetchCertificates } from './actions/certificateActions';
import { fetchNotifications } from './actions/notificationActions';

// Combine all reducers
const rootReducer = combineReducers({
  auth: authReducer,
  notifications: notificationReducer,
  postReducer: postReducer,
  certificates: certificateReducer,
  settings: settingsReducer,
});

// Load persisted state from localStorage
const persistedState = loadState() || {};
console.log('[store] Loaded persisted state:', persistedState);

// Define initial state, merging persisted state with defaults
const initialState = {
  auth: {
    user: persistedState.auth?.user || null,
    token: persistedState.auth?.token || null,
    isAuthenticated: persistedState.auth?.isAuthenticated || false,
    loading: persistedState.auth?.loading || true,
  },
  notifications: {
    followedCategories: persistedState.notifications?.followedCategories || [],
    notifications: persistedState.notifications?.notifications || [],
  },
  postReducer: {
    posts: persistedState.postReducer?.posts || [],
    userPosts: persistedState.postReducer?.userPosts || [],
    completedPosts: persistedState.postReducer?.completedPosts || [],
    post: persistedState.postReducer?.post || null,
    loading: persistedState.postReducer?.loading || false,
    searchResults: persistedState.postReducer?.searchResults || [],
    error: persistedState.postReducer?.error || null,
  },
  certificates: {
    certificates: persistedState.certificates?.certificates || [],
    error: persistedState.certificates?.error || null,
    loading: persistedState.certificates?.loading || true,
  },
  settings: persistedState.settings || {},
};

const middleware = [thunk];

const store = createStore(
  rootReducer,
  initialState,
  applyMiddleware(...middleware)
);

// Throttle function to limit how often we save state
const throttle = (func, limit) => {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Initialize store by restoring state and fetching fresh data if token exists
const initializeStore = async () => {
  const token = localStorage.getItem('token');
  if (token) {
    console.log('[initializeStore] Token found, restoring auth');
    try {
      // Load user first to ensure auth state is set
      await store.dispatch(loadUser());
      // Fetch followed categories
      await store.dispatch(fetchFollowedCategories());
      console.log('[initializeStore] State after fetchFollowedCategories:', store.getState().notifications);

      // Defer non-critical fetches to avoid blocking the initial render
      if (typeof window !== 'undefined' && window.requestIdleCallback) {
        window.requestIdleCallback(() => {
          Promise.all([
            store.dispatch(fetchUserPosts()),
            store.dispatch(fetchCompletedPosts()),
            store.dispatch(fetchNotifications()),
            store.dispatch(fetchCertificates()),
          ]).catch(error => {
            console.error('[initializeStore] Error in deferred fetches:', error);
          });
        }, { timeout: 5000 });
      } else {
        setTimeout(() => {
          Promise.all([
            store.dispatch(fetchUserPosts()),
            store.dispatch(fetchCompletedPosts()),
            store.dispatch(fetchNotifications()),
            store.dispatch(fetchCertificates()),
          ]).catch(error => {
            console.error('[initializeStore] Error in deferred fetches:', error);
          });
        }, 0);
      }
    } catch (error) {
      console.error('[initializeStore] Error during initialization:', error);
    }
  } else {
    console.log('[initializeStore] No token found, using persisted state only');
  }
};

// Run initialization without awaiting non-critical fetches
initializeStore().catch(error => {
  console.error('[initializeStore] Initialization failed:', error);
});

// Subscribe to state changes and persist the full state
store.subscribe(
  throttle(() => {
    const state = store.getState();
    const persistedData = {
      auth: { user: state.auth.user, token: state.auth.token, isAuthenticated: state.auth.isAuthenticated, loading: state.auth.loading },
      notifications: { followedCategories: state.notifications.followedCategories, notifications: state.notifications.notifications },
      postReducer: { 
        posts: state.postReducer.posts, 
        userPosts: state.postReducer.userPosts, 
        completedPosts: state.postReducer.completedPosts, 
        post: state.postReducer.post, 
        loading: state.postReducer.loading,
        searchResults: state.postReducer.searchResults,
        error: state.postReducer.error
      },
      certificates: { certificates: state.certificates.certificates, error: state.certificates.error, loading: state.certificates.loading },
      settings: state.settings,
    };
    saveState(persistedData);
    console.log('[store.subscribe] Saved to localStorage:', persistedData);
  }, 1000)
);

export default store;
