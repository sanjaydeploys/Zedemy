import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import store from './store';
import Layout from './components/Layout';
import PostPage from './components/PostPage';
import SignInSignUp from './components/SignInSignUp';
import Policy from './components/Policy';
import { loadUser } from './actions/authActions';
import HomePage from './pages/HomePage';

const Home = lazy(() => import('./pages/Home'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const PostList = lazy(() => import('./components/PostList'));
const CategoryPage = lazy(() => import('./components/CategoryPage'));
const AddPostForm = lazy(() => import('./components/AddPostForm'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const VerifyCertificate = lazy(() => import('./components/VerifyCertificate'));
const Category = lazy(() => import('./pages/Category'));
const Footer = lazy(() => import('./components/Footer'));
const Notification = lazy(() => import('./components/Notification'));
const CodeEditor = lazy(() => import('./components/CodeEditor'));
const FAQPage = lazy(() => import('./components/FAQPage'));

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const PrivateRoute = ({ children }) => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const policyAccepted = useSelector((state) => state.auth.policyAccepted);

  if (!isAuthenticated) {
    return <SignInSignUp />;
  }

  if (!policyAccepted) {
    return <Policy />;
  }

  return children;
};

const AppContent = () => {
  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  return (
    <Layout>
      <ScrollToTop />
      <Suspense fallback={<div style={{ minHeight: '100vh' }} />}>
        <Routes>
          <Route exact path="/" element={<Home />} />
          <Route path="/category" element={<Category />} />
          <Route exact path="/login" element={<SignInSignUp />} />
          <Route exact path="/register" element={<Register />} />
          <Route exact path="/dashboard" element={<Dashboard />} />
          <Route path="/add-post" element={<PrivateRoute><AddPostForm /></PrivateRoute>} />
          <Route exact path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/post/:slug" element={<PostPage />} />
          <Route path="/category/:category" element={<CategoryPage />} />
          <Route exact path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route exact path="/verify/:uniqueId" element={<VerifyCertificate />} />
          <Route exact path="/explore" element={<PostList />} />
          <Route exact path="/notifications" element={<Notification />} />
          <Route exact path="/certificate-verification" element={<VerifyCertificate />} />
          <Route exact path="/editor" element={<CodeEditor />} />
          <Route exact path="/faq" element={<FAQPage />} />
        </Routes>
        <Footer />
      </Suspense>
    </Layout>
  );
};

const App = () => {
  return (
    <Provider store={store}>
      <Router>
        <AppContent />
      </Router>
    </Provider>
  );
};

export default App;
