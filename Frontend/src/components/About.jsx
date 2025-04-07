import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUser, FaPlus, FaCheck, FaEnvelope, FaCertificate, FaCaretDown } from 'react-icons/fa';

const About = () => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isDemoActive, setIsDemoActive] = useState(false);

  const features = [
    {
      title: 'Authentication',
      icon: <FaUser />,
      description: 'Secure user login with JWT and Google OAuth, stored in DynamoDB.',
      details: 'Users register/login, and tokens are validated via AWS Lambda.',
    },
    {
      title: 'Add Posts',
      icon: <FaPlus />,
      description: 'Create educational content with titles, subtitles, and categories.',
      details: 'Posts are stored in DynamoDB, with assets in S3, triggered by Lambda.',
    },
    {
      title: 'Mark as Completed',
      icon: <FaCheck />,
      description: 'Track progress by marking posts as completed.',
      details: 'Updates user’s completedPosts in DynamoDB, checked via Lambda.',
    },
    {
      title: 'Follow Categories',
      icon: <FaCaretDown />,
      description: 'Subscribe to categories for updates.',
      details: 'Stores followedCategories in DynamoDB, with timestamps for filtering.',
    },
    {
      title: 'Notifications',
      icon: <FaEnvelope />,
      description: 'Get notified about new posts in followed categories.',
      details: 'Emails sent via Nodemailer, notifications stored in DynamoDB.',
    },
    {
      title: 'Certificates',
      icon: <FaCertificate />,
      description: 'Earn certificates upon category completion.',
      details: 'PDFs generated, uploaded to S3, and emailed via Lambda.',
    },
  ];

  const toggleDropdown = (index) => {
    setOpenDropdown(openDropdown === index ? null : index);
  };

  const demoVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeInOut' } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 text-white py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.h1
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-5xl md:text-6xl font-bold text-center mb-8"
        >
          About LearnSphere
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-lg md:text-xl text-center mb-12"
        >
          A cutting-edge e-learning platform by HogwartsEdx, powered by AWS serverless architecture.
        </motion.p>

        {/* Features with Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.05 }}
              className="bg-gray-800 rounded-lg p-6 cursor-pointer"
              onClick={() => toggleDropdown(index)}
            >
              <div className="flex items-center mb-4">
                <span className="text-3xl mr-4">{feature.icon}</span>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
              </div>
              <p className="text-gray-300">{feature.description}</p>
              <AnimatePresence>
                {openDropdown === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 text-gray-400"
                  >
                    {feature.details}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Live Demo Stream Model */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-center mb-12"
        >
          <button
            onClick={() => setIsDemoActive(!isDemoActive)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full transition-colors duration-300"
          >
            {isDemoActive ? 'Hide Demo' : 'Show Live Demo'}
          </button>
        </motion.div>

        <AnimatePresence>
          {isDemoActive && (
            <motion.div
              variants={demoVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-gray-800 rounded-lg p-8"
            >
              <h2 className="text-3xl font-bold mb-6 text-center">How LearnSphere Works</h2>
              <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                {/* System Design Flow */}
                <div className="relative w-full md:w-3/4">
                  <motion.div
                    animate={{ x: [0, 10, 0], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="absolute top-0 left-0 w-4 h-4 bg-blue-500 rounded-full"
                  />
                  <div className="flex flex-col gap-6">
                    <motion.div className="bg-gray-700 p-4 rounded-lg" whileHover={{ x: 10 }}>
                      <strong>User Auth</strong>: Logs in → Lambda validates → DynamoDB stores.
                    </motion.div>
                    <motion.div className="bg-gray-700 p-4 rounded-lg" whileHover={{ x: 10 }}>
                      <strong>Add Post</strong>: Creates post → Lambda saves to DynamoDB → S3 stores assets.
                    </motion.div>
                    <motion.div className="bg-gray-700 p-4 rounded-lg" whileHover={{ x: 10 }}>
                      <strong>Follow Category</strong>: Subscribes → DynamoDB updates → Notifications queued.
                    </motion.div>
                    <motion.div className="bg-gray-700 p-4 rounded-lg" whileHover={{ x: 10 }}>
                      <strong>New Post Notification</strong>: Lambda triggers → Email sent → DynamoDB logs.
                    </motion.div>
                    <motion.div className="bg-gray-700 p-4 rounded-lg" whileHover={{ x: 10 }}>
                      <strong>Mark Completed</strong>: Updates DynamoDB → Checks category completion.
                    </motion.div>
                    <motion.div className="bg-gray-700 p-4 rounded-lg" whileHover={{ x: 10 }}>
                      <strong>Certificate</strong>: All completed → Lambda generates PDF → S3 stores → Email sent.
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="text-center text-gray-400 mt-8"
        >
          LearnSphere by HogwartsEdx - Empowering learning with serverless innovation.
        </motion.p>
      </div>
    </section>
  );
};

export default About;