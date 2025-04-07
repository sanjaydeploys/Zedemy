import { GET_CERTIFICATES, CERTIFICATES_ERROR } from '../actions/types';

const initialState = {
    certificates: [],
    error: null, // Changed to null for consistency
    loading: true // Added to match component
};

export default function(state = initialState, action) {
    const { type, payload } = action;

    switch (type) {
        case GET_CERTIFICATES:
            return {
                ...state,
                certificates: payload,
                error: null,
                loading: false
            };
        case CERTIFICATES_ERROR:
            return {
                ...state,
                error: payload,
                certificates: [],
                loading: false
            };
        default:
            return state;
    }
}