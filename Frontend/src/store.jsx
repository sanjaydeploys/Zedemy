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
        post: null, // Do not persist individual post
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
            await store.dispatch(loadUser());
            await store.dispatch(fetchFollowedCategories());
            if (typeof window !== 'undefined' && window.requestIdleCallback) {
                window.requestIdleCallback(() => {
                    Promise.all([
                        store.dispatch(fetchUserPosts()),
                        store.dispatch(fetchCompletedPosts()),
                        store.dispatch(fetchNotifications()),
                        store.dispatch(fetchCertificates())
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
                        store.dispatch(fetchCertificates())
                    ]).catch(error => {
                        console.error('[initializeStore] Error in deferred fetches:', error);
                    });
                }, 1000);
            }
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
            auth: { user: state.auth.user, token: state.auth.token, isAuthenticated: state.auth.isAuthenticated, loading: state.auth.loading },
            notifications: { followedCategories: state.notifications.followedCategories, notifications: state.notifications.notifications },
            postReducer: {
                posts: state.postReducer.posts,
                userPosts: state.postReducer.userPosts,
                completedPosts: state.postReducer.completedPosts,
                post: null, // Do not persist individual post
                loading: state.postReducer.loading,
                searchResults: state.postReducer.searchResults,
                error: state.postReducer.error
            },
            certificates: { certificates: state.certificates.certificates, error: state.certificates.error, loading: state.certificates.loading },
            settings: state.settings
        };
        saveState(persistedData);
        console.log('[store.subscribe] Saved to localStorage:', persistedData);
    }, 1000)
);

export default store;
