import {
    FETCH_USER_SUCCESS,
    LOGIN_SUCCESS,
    REGISTER_SUCCESS,
    LOGOUT,
    AUTHENTICATE_USER,
    ACCEPT_POLICY_SUCCESS,
    AUTH_ERROR
} from '../actions/types';

const initialState = {
    token: localStorage.getItem('token'),
    isAuthenticated: null,
    loading: true,
    user: null,
    policyAccepted: false
};

const authReducer = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_USER_SUCCESS:
        case REGISTER_SUCCESS:
        case LOGIN_SUCCESS:
            return {
                ...state,
                token: action.payload.token,
                user: action.payload.user,
                isAuthenticated: true,
                loading: false,
                policyAccepted: action.payload.policyAccepted || false
            };
        case AUTHENTICATE_USER:
            return { ...state, isAuthenticated: action.payload, loading: false };
        case ACCEPT_POLICY_SUCCESS:
            return {
                ...state,
                user: action.payload,
                policyAccepted: true
            };
        case AUTH_ERROR:
        case LOGOUT:
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            return {
                ...state,
                token: null,
                isAuthenticated: false,
                loading: false,
                user: null,
                policyAccepted: false
            };
        default:
            return state;
    }
};

export default authReducer;