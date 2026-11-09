require("dotenv").config();

const express = require("express");
const connectDB = require("./config/db");
const authorRoutes = require("./routes/authorRoutes");
const bookRoutes = require("./routes/bookRoutes");

const app = express();
const port = process.env.port || 5000;

app.use(express.json());
app.use("/books", bookRoutes);
app.use("/authors", authorRoutes);

// Health-check endpoint
app.get("/", (req, res) => {
    res.status(200).json({
        message: "ReadMore API is running"
    });
});

// Start the server after MongoDB connects
const startServer = async () => {
    await connectDB();

    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
};

startServer();