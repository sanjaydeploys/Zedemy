import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSpring, animated } from 'react-spring';
import { useDispatch, useSelector } from 'react-redux';
import { followCategory, unfollowCategory, fetchFollowedCategories } from '../actions/notificationActions';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Helmet } from 'react-helmet';
import '../styles/Category.css';
import {
    FaHtml5, FaCss3Alt, FaJs, FaNodeJs, FaReact, FaAngular, FaVuejs,
    FaPython, FaJava, FaPhp, FaSwift, FaGithub
} from 'react-icons/fa';
import {
    SiTypescript, SiGatsby, SiSvelte, SiGraphql, SiRuby, SiCsharp,
    SiCplusplus, SiKotlin, SiDart, SiFlutter, SiReactos
} from 'react-icons/si';
import Modal from '../components/Modal';

const categories = [
    { name: 'VS Code', icon: <FaGithub /> },
    { name: 'HTML', icon: <FaHtml5 /> },
    { name: 'CSS', icon: <FaCss3Alt /> },
    { name: 'JavaScript', icon: <FaJs /> },
    { name: 'Node.js', icon: <FaNodeJs /> },
    { name: 'React', icon: <FaReact /> },
    { name: 'Angular', icon: <FaAngular /> },
    { name: 'Vue.js', icon: <FaVuejs /> },
    { name: 'Next.js', icon: <FaReact /> },
    { name: 'Nuxt.js', icon: <FaVuejs /> },
    { name: 'Gatsby', icon: <SiGatsby /> },
    { name: 'Svelte', icon: <SiSvelte /> },
    { name: 'TypeScript', icon: <SiTypescript /> },
    { name: 'GraphQL', icon: <SiGraphql /> },
    { name: 'PHP', icon: <FaPhp /> },
    { name: 'Python', icon: <FaPython /> },
    { name: 'Ruby', icon: <SiRuby /> },
    { name: 'Java', icon: <FaJava /> },
    { name: 'C#', icon: <SiCsharp /> },
    { name: 'C++', icon: <SiCplusplus /> },
    { name: 'Swift', icon: <FaSwift /> },
    { name: 'Kotlin', icon: <SiKotlin /> },
    { name: 'Dart', icon: <SiDart /> },
    { name: 'Flutter', icon: <SiFlutter /> },
    { name: 'React Native', icon: <SiReactos /> }
];

const Category = () => {
    const dispatch = useDispatch();
    const followedCategories = useSelector(state => state.notifications.followedCategories) || [];
    const token = useSelector(state => state.auth.token);

    const [showConfirmation, setShowConfirmation] = useState(false);
    const [categoryToUnfollow, setCategoryToUnfollow] = useState('');

    useEffect(() => {
        if (token) {
            dispatch(fetchFollowedCategories());
        }
    }, [dispatch, token]);

    const handleFollow = (category) => {
        if (!token) {
            toast.error('You need to be logged in to follow categories.');
            return;
        }
        dispatch(followCategory(category));
    };

    const handleUnfollow = (category) => {
        if (!token) {
            toast.error('You need to be logged in to unfollow categories.');
            return;
        }
        setCategoryToUnfollow(category);
        setShowConfirmation(true);
    };

    const confirmUnfollow = () => {
        dispatch(unfollowCategory(categoryToUnfollow));
        setShowConfirmation(false);
    };

    const cancelUnfollow = () => {
        setShowConfirmation(false);
    };

    return (
        <div className="category">
            <Helmet>
                <title>Explore Coding Categories & Follow Updates - Zedemy</title>
                <meta
                    name="description"
                    content="Browse coding categories like HTML & JavaScript on Zedemy, founded by Sanjay Patidar. Follow categories to get email updates on new courses."
                />
                <meta
                    name="keywords"
                    content="coding courses, HTML, JavaScript, Python, React, Zedemy, Sanjay Patidar, online learning, follow categories, email notifications"
                />
                <meta name="author" content="Sanjay Patidar" />
                <meta name="robots" content="index, follow" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <link rel="canonical" href="https://zedemy.vercel.app/category" />
                <meta property="og:title" content="Explore Coding Categories & Follow Updates - Zedemy" />
                <meta
                    property="og:description"
                    content="Browse coding categories like HTML & JavaScript on Zedemy, founded by Sanjay Patidar. Follow categories to get email updates on new courses."
                />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://zedemy.vercel.app/category" />
                <meta property="og:image" content="https://sanjaybasket.s3.ap-south-1.amazonaws.com/zedemy-logo.png" />
                <meta property="og:site_name" content="Zedemy" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Explore Coding Categories & Follow Updates - Zedemy" />
                <meta
                    name="twitter:description"
                    content="Browse coding categories like HTML & JavaScript on Zedemy, founded by Sanjay Patidar. Follow categories to get email updates on new courses."
                />
                <meta name="twitter:image" content="https://sanjaybasket.s3.ap-south-1.amazonaws.com/zedemy-logo.png" />
                <link rel="icon" type="image/png" href="https://sanjaybasket.s3.ap-south-1.amazonaws.com/zedemy-logo.png" />
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "CollectionPage",
                        "name": "Coding Categories",
                        "description": "Browse coding categories like HTML & JavaScript on Zedemy, founded by Sanjay Patidar. Follow categories to get email updates on new courses.",
                        "url": "https://zedemy.vercel.app/category",
                        "publisher": {
                            "@type": "Organization",
                            "name": "Zedemy",
                            "founder": {
                                "@type": "Person",
                                "name": "Sanjay Patidar"
                            }
                        },
                        "mainEntity": {
                            "@type": "ItemList",
                            "itemListElement": categories.map((category, index) => ({
                                "@type": "ListItem",
                                "position": index + 1,
                                "item": {
                                    "@type": "Thing",
                                    "name": category.name,
                                    "url": `https://zedemy.vercel.app/category/${category.name.toLowerCase()}`
                                }
                            }))
                        }
                    })}
                </script>
            </Helmet>
            <h2>Categories</h2>
            <ul>
                {categories.map((category, index) => {
                    const animationProps = useSpring({
                        from: { opacity: 0, transform: 'translate3d(0,-40px,0)' },
                        to: { opacity: 1, transform: 'translate3d(0,0px,0)' },
                        config: { duration: 1000 },
                        delay: index * 200,
                    });

                    const isFollowed = followedCategories.includes(category.name);

                    return (
                        <animated.li key={category.name} className="category-item" style={animationProps}>
                            <Link to={`/category/${category.name}`}>
                                {category.icon}
                                <span>{category.name}</span>
                            </Link>
                            {isFollowed ? (
                                <button onClick={() => handleUnfollow(category.name)}>Unfollow</button>
                            ) : (
                                <button onClick={() => handleFollow(category.name)}>Follow</button>
                            )}
                        </animated.li>
                    );
                })}
            </ul>
            {showConfirmation && (
                <Modal
                    message={`Are you sure you want to unfollow ${categoryToUnfollow}?`}
                    onConfirm={confirmUnfollow}
                    onCancel={cancelUnfollow}
                />
            )}
            <ToastContainer />
        </div>
    );
};

export default Category;
