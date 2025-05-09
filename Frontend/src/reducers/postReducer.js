import {
    FETCH_POSTS_SUCCESS,
    FETCH_POSTS_FAILURE,
    ADD_POST_SUCCESS,
    FETCH_USER_POSTS_SUCCESS,
    FETCH_USER_POSTS_REQUEST,
    FETCH_USER_POSTS_FAILURE,
    UPDATE_POST_SUCCESS,
    DELETE_POST_SUCCESS,
    SEARCH_POSTS_SUCCESS,
    FETCH_POST_SUCCESS,
    FETCH_POST_FAILURE,
    SEARCH_POSTS_FAILURE,
    SEARCH_POSTS_CLEAR,
    MARK_POST_COMPLETED_SUCCESS,
    FETCH_COMPLETED_POSTS_SUCCESS,
    FETCH_COMPLETED_POSTS_FAILURE,
    FETCH_CRITICAL_POST_SUCCESS
} from '../actions/types';

const initialState = {
    posts: [],
    userPosts: [],
    completedPosts: [],
    searchResults: [],
    post: null,
    criticalPost: null,
    loading: false,
    error: null,
};

const postReducer = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_POSTS_SUCCESS:
            return { ...state, posts: action.payload.posts || action.payload, error: null };
        case FETCH_POSTS_FAILURE:
            return { ...state, error: action.payload };
        case FETCH_COMPLETED_POSTS_SUCCESS:
            return { ...state, completedPosts: action.payload, error: null };
        case FETCH_COMPLETED_POSTS_FAILURE:
            return { ...state, completedPosts: [], error: action.payload };
        case FETCH_USER_POSTS_REQUEST:
            return { ...state, loading: true, error: null };
        case FETCH_USER_POSTS_SUCCESS:
            return { ...state, userPosts: action.payload, loading: false, error: null };
        case FETCH_USER_POSTS_FAILURE:
            return { ...state, loading: false, error: action.payload };
        case ADD_POST_SUCCESS:
            return {
                ...state,
                posts: [action.payload, ...state.posts],
                userPosts: [action.payload, ...state.userPosts],
                error: null,
            };
        case UPDATE_POST_SUCCESS:
            return {
                ...state,
                posts: state.posts.map(post => post.postId === action.payload.postId ? action.payload : post),
                userPosts: state.userPosts.map(post => post.postId === action.payload.postId ? action.payload : post),
                error: null,
            };
        case DELETE_POST_SUCCESS:
            return {
                ...state,
                posts: state.posts.filter(post => post.postId !== action.payload),
                userPosts: state.userPosts.filter(post => post.postId !== action.payload),
                error: null,
            };
        case SEARCH_POSTS_SUCCESS:
            return { ...state, searchResults: action.payload, error: null };
        case SEARCH_POSTS_FAILURE:
            return { ...state, searchResults: [], error: action.payload };
        case SEARCH_POSTS_CLEAR:
            return { ...state, searchResults: [], error: null };
        case FETCH_POST_SUCCESS:
            return { ...state, post: action.payload, error: null };
        case FETCH_POST_FAILURE:
            return { ...state, post: null, error: action.payload };
        case FETCH_CRITICAL_POST_SUCCESS:
            return { ...state, criticalPost: action.payload, error: null };
        case MARK_POST_COMPLETED_SUCCESS:
            const newCompletedPost = state.posts.find(post => post.postId === action.payload.postId) || { postId: action.payload.postId };
            return {
                ...state,
                completedPosts: state.completedPosts.some(post => post.postId === action.payload.postId)
                    ? state.completedPosts
                    : [...state.completedPosts, newCompletedPost],
                error: null,
            };
        default:
            return state;
    }
};

export default postReducer;
