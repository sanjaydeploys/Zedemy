import {
    FETCH_POSTS_SUCCESS,
    ADD_POST_SUCCESS,
    FETCH_USER_POSTS_SUCCESS,
    FETCH_USER_POSTS_REQUEST,
    FETCH_USER_POSTS_FAILURE,
    UPDATE_POST_SUCCESS,
    DELETE_POST_SUCCESS,
    SEARCH_POSTS_SUCCESS,
    FETCH_POST_SUCCESS,
    SEARCH_POSTS_FAILURE,
    SEARCH_POSTS_CLEAR,
    MARK_POST_COMPLETED_SUCCESS,
    FETCH_COMPLETED_POSTS_SUCCESS,
    FETCH_COMPLETED_POSTS_FAILURE
} from '../actions/types';

const initialState = {
    posts: [],
    userPosts: [],
    completedPosts: [],
    searchResults: [],
    post: null,
    loading: false // Added for FETCH_USER_POSTS_REQUEST
};

const postReducer = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_POSTS_SUCCESS:
            return { ...state, posts: action.payload.posts || action.payload };
        case FETCH_COMPLETED_POSTS_SUCCESS:
            return { ...state, completedPosts: action.payload };
        case FETCH_COMPLETED_POSTS_FAILURE:
            return { ...state, completedPosts: [] };
        case FETCH_USER_POSTS_REQUEST:
            return { ...state, loading: true };
        case FETCH_USER_POSTS_SUCCESS:
            return { ...state, userPosts: action.payload, loading: false };
        case FETCH_USER_POSTS_FAILURE:
            return { ...state, loading: false };
        case ADD_POST_SUCCESS:
            return {
                ...state,
                posts: [action.payload, ...state.posts],
                userPosts: [action.payload, ...state.userPosts]
            };
        case UPDATE_POST_SUCCESS:
            return {
                ...state,
                posts: state.posts.map(post => post.postId === action.payload.postId ? action.payload : post),
                userPosts: state.userPosts.map(post => post.postId === action.payload.postId ? action.payload : post)
            };
        case DELETE_POST_SUCCESS:
            return {
                ...state,
                posts: state.posts.filter(post => post.postId !== action.payload),
                userPosts: state.userPosts.filter(post => post.postId !== action.payload)
            };
        case SEARCH_POSTS_SUCCESS:
            return { ...state, posts: action.payload };
            case 'SEARCH_POSTS_FAILURE':
             return { ...state, searchResults: [], error: action.payload };
         case 'SEARCH_POSTS_CLEAR':
             return { ...state, searchResults: [], error: null };
        case FETCH_POST_SUCCESS:
            return { ...state, post: action.payload };
        case MARK_POST_COMPLETED_SUCCESS:
            const newCompletedPost = state.posts.find(post => post.postId === action.payload.postId) || { postId: action.payload.postId };
            return {
                ...state,
                completedPosts: state.completedPosts.some(post => post.postId === action.payload.postId)
                    ? state.completedPosts
                    : [...state.completedPosts, newCompletedPost]
            };
        default:
            return state;
    }
};

export default postReducer;
