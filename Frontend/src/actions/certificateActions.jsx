import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { setAuthToken } from '../utils/setAuthToken';
import { GET_CERTIFICATES, CERTIFICATES_ERROR } from './types';

const API_BASE_URL = 'https://g3u06ptici.execute-api.ap-south-1.amazonaws.com/prod/api/certificates';

export const fetchCertificates = () => async dispatch => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('No token found, skipping fetch certificates');
        toast.error('Please log in to view certificates.', { position: 'top-right', autoClose: 2000 });
        return;
    }

    console.log('Fetching certificates for authenticated user...');
    setAuthToken(token);
    try {
        const res = await axios.get(API_BASE_URL, {
            headers: { 'x-auth-token': token }
        });
        console.log('Certificates fetched:', res.data);
        dispatch({ type: GET_CERTIFICATES, payload: res.data });
    } catch (error) {
        const errorMsg = error.response?.data?.message || 'Error fetching certificates';
        console.error('Error fetching certificates:', errorMsg);
        dispatch({ type: CERTIFICATES_ERROR, payload: errorMsg });
        toast.error(errorMsg, { position: 'top-right', autoClose: 2000 });
    }
};

export const fetchCertificateByUniqueId = (uniqueId) => async dispatch => {
    console.log(`Fetching certificate by uniqueId: ${uniqueId}`);
    try {
        const res = await axios.get(`${API_BASE_URL}/${uniqueId}`);
        console.log('Certificate fetched:', res.data);
        dispatch({ type: GET_CERTIFICATES, payload: [res.data] }); // Store as array for consistency
    } catch (error) {
        const errorMsg = error.response?.data?.message || 'Certificate not found';
        console.error('Error fetching certificate:', errorMsg);
        dispatch({ type: CERTIFICATES_ERROR, payload: errorMsg });
        toast.error(errorMsg, { position: 'top-right', autoClose: 2000 });
    }
};
