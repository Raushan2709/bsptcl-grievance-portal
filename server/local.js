import app from "./app.js";

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`BSPTCL Grievance Portal API running locally at http://localhost:${PORT}`);
});
