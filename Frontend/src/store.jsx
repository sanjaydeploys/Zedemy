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

const rootReducer = combineReducers({
    auth: authReducer,
    notifications: notificationReducer,
    postReducer: postReducer,
    certificates: certificateReducer,
    settings: settingsReducer
});

const persistedState = loadState() || {};
console.log('[store] Loaded persisted state:', persistedState);

const initialState = {
    auth: {
        user: persistedState.auth?.user || null,
        token: persistedState.auth?.token || null,
        isAuthenticated: persistedState.auth?.isAuthenticated || false,
        loading: persistedState.auth?.loading || true
    },
    notifications: {
        followedCategories: persistedState.notifications?.followedCategories || [],
        notifications: persistedState.notifications?.notifications || []
    },
    postReducer: {
        posts: persistedState.postReducer?.posts || [],
        userPosts: persistedState.postReducer?.userPosts || [],
        completedPosts: persistedState.postReducer?.completedPosts || [],
        post: persistedState.postReducer?.post || null,
        loading: persistedState.postReducer?.loading || false,
        searchResults: persistedState.postReducer?.searchResults || [],
        error: persistedState.postReducer?.error || null
    },
    certificates: {
        certificates: persistedState.certificates?.certificates || [],
        error: persistedState.certificates?.error || null,
        loading: persistedState.certificates?.loading || true
    },
    settings: persistedState.settings || {}
};

const middleware = [thunk];

const store = createStore(
    rootReducer,
    initialState,
    applyMiddleware(...middleware)
);

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

const initializeStore = async () => {
    const token = localStorage.getItem('token');
    if (token) {
        console.log('[initializeStore] Token found, restoring auth');
        try {
            const state = store.getState();
            await store.dispatch(loadUser());

            // Only fetch if data is not already present
            if (!state.notifications.followedCategories.length) {
                await store.dispatch(fetchFollowedCategories());
            }

            // Defer non-critical actions with setTimeout
            setTimeout(() => {
                Promise.all([
                    !state.postReducer.userPosts.length && store.dispatch(fetchUserPosts()),
                    !state.postReducer.completedPosts.length && store.dispatch(fetchCompletedPosts({ retries: 3, delay: 1000 })),
                    !state.notifications.notifications.length && store.dispatch(fetchNotifications()),
                    !state.certificates.certificates.length && store.dispatch(fetchCertificates())
                ].filter(Boolean)).catch(error => {
                    console.error('[initializeStore] Error in deferred fetches:', error);
                });
            }, 2000); // Defer by 2 seconds
        } catch (error) {
            console.error('[initializeStore] Error:', error);
        }
    } else {
        console.log('[initializeStore] No token found');
    }
};

initializeStore().catch(error => {
    console.error('[initializeStore] Initialization failed:', error);
});

store.subscribe(
    throttle(() => {
        const state = store.getState();
        const persistedData = {
            auth: {
                user: state.auth.user,
                token: state.auth.token,
                isAuthenticated: state.auth.isAuthenticated
            },
            notifications: {
                followedCategories: state.notifications.followedCategories
            },
            postReducer: {
                post: state.postReducer.post,
                userPosts: state.postReducer.userPosts,
                completedPosts: state.postReducer.completedPosts
            },
            certificates: {
                certificates: state.certificates.certificates
            },
            settings: state.settings
        };
        saveState(persistedData);
        if (process.env.NODE_ENV === 'development') {
            console.log('[store.subscribe] Saved to localStorage:', persistedData);
        }
    }, 2000)
);

export default store;
