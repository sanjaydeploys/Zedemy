import {
    FETCH_NOTIFICATIONS_SUCCESS,
    ADD_NOTIFICATION_SUCCESS,
    MARK_NOTIFICATION_AS_READ_SUCCESS,
    FOLLOW_CATEGORY_SUCCESS,
    UNFOLLOW_CATEGORY_SUCCESS,
    FETCH_FOLLOWED_CATEGORIES_SUCCESS
} from '../actions/types';

const initialState = {
    notifications: [],
    followedCategories: []
};

const notificationReducer = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_NOTIFICATIONS_SUCCESS:
            return { ...state, notifications: action.payload };
        case ADD_NOTIFICATION_SUCCESS:
            return { ...state, notifications: [action.payload, ...state.notifications] };
        case MARK_NOTIFICATION_AS_READ_SUCCESS:
            return {
                ...state,
                notifications: state.notifications.map(notification =>
                    notification.notificationId === action.payload.notificationId ? action.payload : notification
                )
            };
        case FOLLOW_CATEGORY_SUCCESS:
            return { ...state, followedCategories: action.payload };
        case UNFOLLOW_CATEGORY_SUCCESS:
            return { ...state, followedCategories: action.payload };
        case FETCH_FOLLOWED_CATEGORIES_SUCCESS:
            console.log('[notificationReducer] FETCH_FOLLOWED_CATEGORIES_SUCCESS, payload:', action.payload);
            return { ...state, followedCategories: action.payload };
        default:
            return state;
    }
};

export default notificationReducer;