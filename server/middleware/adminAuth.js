const adminAuth = (req, res, next) => {
  const adminPassword = req.headers['x-admin-password'];
  
  if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }
  
  next();
};

module.exports = adminAuth;
