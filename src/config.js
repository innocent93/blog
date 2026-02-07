module.exports = {
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/nobzo-blog',
  JWT_SECRET: process.env.JWT_SECRET || 'replace-me',
  PORT: process.env.PORT || 3000,
};
