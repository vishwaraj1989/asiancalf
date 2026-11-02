module.exports = (req, res, next) => {
  // Product images and videos are fetched from the Render API by the Vercel app.
  // Keep this policy scoped to uploads; Helmet's same-origin default stays in
  // place for the rest of the API.
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
};
