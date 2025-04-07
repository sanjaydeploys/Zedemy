import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { saveAs } from 'file-saver';
import styled, { keyframes } from 'styled-components';
import { useInView } from 'react-intersection-observer';
import { ClipLoader } from 'react-spinners';
import { Helmet } from 'react-helmet';
import { fetchCertificateByUniqueId, fetchCertificates } from '../actions/certificateActions';
import axios from 'axios';

// Keyframes for animations
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Styled components (unchanged)
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Arial', sans-serif;
  color: #333;
`;

const Title = styled.h1`
  text-align: center;
  color: #333;
  font-size: 2.5rem;
  margin-bottom: 20px;
  animation: ${fadeInUp} 1s ease-out;
`;

const Subtitle = styled.h2`
  text-align: center;
  color: #555;
  margin-top: 40px;
  font-size: 2rem;
  animation: ${fadeInUp} 1s ease-out;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  animation: ${fadeInUp} 1s ease-out;

  @media (min-width: 600px) {
    flex-direction: row;
    justify-content: center;
  }
`;

const Input = styled.input`
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 5px;
  width: 100%;
  max-width: 300px;
  transition: all 0.3s ease-in-out;

  &:focus {
    border-color: #007BFF;
    box-shadow: 0 0 5px rgba(0, 123, 255, 0.5);
  }

  @media (min-width: 600px) {
    width: auto;
  }
`;

const Button = styled.button`
  padding: 10px 20px;
  font-size: 16px;
  color: #fff;
  background-color: #007BFF;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease-in-out;

  &:hover {
    background-color: #0056b3;
  }
`;

const CertificateList = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  margin-top: 20px;
  animation: ${fadeInUp} 1s ease-out;

  @media (min-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 900px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const CertificateItem = styled.div`
  border: 1px solid #ccc;
  border-radius: 10px;
  padding: 20px;
  background-color: #fff;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
  opacity: 0;
  transform: translateY(20px);

  &.visible {
    opacity: 1;
    transform: translateY(0);
    transition: all 0.5s ease-out;
  }

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  }
`;

const ErrorMessage = styled.p`
  color: red;
  text-align: center;
  animation: ${fadeInUp} 1s ease-out;
`;

const LoadingMessage = styled.p`
  text-align: center;
  animation: ${fadeInUp} 1s ease-out;
`;

const CertificateDetail = styled.div`
  text-align: center;
  margin: 20px 0;
  animation: ${fadeInUp} 1s ease-out;
`;

const VerifyCertificate = () => {
    const { uniqueId } = useParams();
    const dispatch = useDispatch();
    const { certificates, error, loading } = useSelector(state => state.certificates || {
        certificates: [],
        error: null,
        loading: true
    });
    const [searchCriteria, setSearchCriteria] = useState({
        userName: '',
        uniqueId: '',
        date: ''
    });

    useEffect(() => {
        if (uniqueId) {
            dispatch(fetchCertificateByUniqueId(uniqueId));
        } else {
            dispatch(fetchCertificates());
        }
    }, [dispatch, uniqueId]);

    const handleChange = (e) => {
        setSearchCriteria({ ...searchCriteria, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        axios.get('https://urgwdthmkk.execute-api.ap-south-1.amazonaws.com/prod/api/certificates', { params: searchCriteria })
            .then(response => {
                dispatch({ type: 'GET_CERTIFICATES', payload: response.data });
            })
            .catch(error => {
                dispatch({ type: 'CERTIFICATES_ERROR', payload: 'Error fetching certificates' });
            });
    };

    const handleDownload = (cert) => {
        console.log(`Requesting download for certificate with uniqueId: ${cert.uniqueId}`);
        axios.get(`https://urgwdthmkk.execute-api.ap-south-1.amazonaws.com/prod/api/certificates/${cert.uniqueId}/download`)
            .then(response => {
                console.log('Signed URL received:', response.data.url);
                window.location.href = response.data.url;
            })
            .catch(error => {
                console.error('Error downloading certificate:', error);
            });
    };

    const singleCertificate = uniqueId && certificates.length === 1 ? certificates[0] : null;

    return (
        <Container>
            <Helmet>
                <title>Verify Your Certificates - LearnAndShare | Fast and Easy Certificate Verification and Download</title>
                {/* ... rest of Helmet content ... */}
            </Helmet>
            <Title>Certificate Verification</Title>
            {loading && (
                <LoadingMessage>
                    <ClipLoader size={50} color={"#007BFF"} loading={loading} />
                </LoadingMessage>
            )}
            {!loading && singleCertificate ? (
                <CertificateDetail>
                    <p>Certificate for: {singleCertificate.user.name}</p>
                    <p>Category: {singleCertificate.category}</p>
                    <p>Date: {new Date(singleCertificate.date || singleCertificate.createdAt).toLocaleDateString()}</p>
                    <Button onClick={() => handleDownload(singleCertificate)}>Download Certificate</Button>
                </CertificateDetail>
            ) : (
                !loading && uniqueId && error && <ErrorMessage>No certificate found for this unique ID</ErrorMessage>
            )}
            <Subtitle>Search Certificates</Subtitle>
            <Form onSubmit={handleSubmit}>
                <label htmlFor="userName">User Name:</label>
                <Input type="text" id="userName" name="userName" placeholder="Enter User Name" value={searchCriteria.userName} onChange={handleChange} />
                <label htmlFor="uniqueId">Unique ID:</label>
                <Input type="text" id="uniqueId" name="uniqueId" placeholder="Enter Unique ID" value={searchCriteria.uniqueId} onChange={handleChange} />
                <label htmlFor="date">Date:</label>
                <Input type="date" id="date" name="date" value={searchCriteria.date} onChange={handleChange} />
                <Button type="submit">Search Certificates</Button>
            </Form>
            {loading && (
                <LoadingMessage>
                    <ClipLoader size={50} color={"#007BFF"} loading={loading} />
                </LoadingMessage>
            )}
            {!loading && error && !singleCertificate && <ErrorMessage>{error}</ErrorMessage>}
            {!loading && certificates.length > 0 && !singleCertificate && (
                <CertificateList>
                    {certificates.map(cert => (
                        <CertificateItemWrapper key={cert.certificateId || cert.uniqueId}>
                            {({ ref, inView }) => (
                                <CertificateItem ref={ref} className={inView ? 'visible' : ''}>
                                    <p>Certificate for: {cert.user.name}</p>
                                    <p>Category: {cert.category}</p>
                                    <p>Date: {new Date(cert.date || cert.createdAt).toLocaleDateString()}</p>
                                    <Button onClick={() => handleDownload(cert)}>Download Certificate</Button>
                                </CertificateItem>
                            )}
                        </CertificateItemWrapper>
                    ))}
                </CertificateList>
            )}
            {!loading && certificates.length === 0 && !error && !singleCertificate && <ErrorMessage>No certificates found</ErrorMessage>}
        </Container>
    );
};

const CertificateItemWrapper = ({ children }) => {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1,
    });

    return children({ ref, inView });
};

export default VerifyCertificate;