import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { searchPosts } from '../actions/postActions';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
`;

const SearchContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    animation: ${fadeIn} 0.5s ease-in;

    @media (min-width: 768px) {
        flex-direction: row;
    }
`;

const SearchInput = styled.input`
    padding: 10px 15px;
    border: 1px solid #212121;
    border-radius: 25px;
    margin-bottom: 10px;
    outline: none;
    font-size: 16px;
    width: 100%;
    max-width: 300px;
    background-color: #ffffff;
    color: #212121;

    &:focus {
        border-color: #003c8f;
        outline: 3px solid #1565c0;
        outline-offset: 2px;
    }

    @media (min-width: 768px) {
        margin-right: 10px;
        margin-bottom: 0;
    }
`;

const SearchButton = styled.button`
    padding: 10px 20px;
    border: none;
    border-radius: 25px;
    background-color: #1565c0;
    color: #ffffff;
    cursor: pointer;
    font-size: 16px;
    transition: background-color 0.3s ease;
    min-height: 44px;
    min-width: 44px;

    &:hover {
        background-color: #003c8f;
    }

    &:focus {
        outline: 3px solid #1565c0;
        outline-offset: 2px;
    }
`;

const SearchCount = styled.p`
    margin-top: 10px;
    font-size: 14px;
    color: #212121;
`;

const ClearSearch = styled.span`
    font-size: 14px;
    color: #1565c0;
    cursor: pointer;
    transition: color 0.3s ease;

    &:hover {
        color: #003c8f;
    }

    &:focus {
        outline: 3px solid #1565c0;
        outline-offset: 2px;
    }
`;

const ErrorMessage = styled.p`
    margin-top: 10px;
    font-size: 14px;
    color: #b71c1c;
`;

const SearchBlog = () => {
    const dispatch = useDispatch();
    const [keyword, setKeyword] = useState('');
    const [searching, setSearching] = useState(false);
    const { searchResults, error } = useSelector(state => state.postReducer || { searchResults: [], error: null });

    useEffect(() => {
        if (searchResults || error) {
            setSearching(false);
        }
    }, [searchResults, error]);

    const handleSearch = () => {
        if (keyword.trim() !== '') {
            setSearching(true);
            dispatch(searchPosts(keyword));
        }
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            handleSearch();
        }
    };

    const clearSearch = () => {
        setKeyword('');
        setSearching(false);
        dispatch({ type: 'SEARCH_POSTS_CLEAR' });
    };

    return (
        <SearchContainer role="search">
            <SearchInput
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search blog posts..."
                aria-label="Search blog posts"
            />
            <SearchButton onClick={handleSearch} aria-label="Search blog posts">Search</SearchButton>
            {!searching && searchResults && searchResults.length > 0 && (
                <SearchCount>{searchResults.length} results found</SearchCount>
            )}
            {!searching && searchResults && searchResults.length === 0 && (
                <SearchCount>No results found</SearchCount>
            )}
            {!searching && error && (
                <ErrorMessage>Error: {error}</ErrorMessage>
            )}
            {!searching && keyword !== '' && (
                <ClearSearch onClick={clearSearch} role="button" tabIndex="0" onKeyPress={(e) => e.key === 'Enter' && clearSearch()} aria-label="Clear search results">
                    Clear Search
                </ClearSearch>
            )}
        </SearchContainer>
    );
};

export default SearchBlog;
