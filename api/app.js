import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoute from "./routes/auth.route.js";
import postRoute from "./routes/post.route.js";
import testRoute from "./routes/test.route.js";
import userRoute from "./routes/user.route.js";
import chatRoute from "./routes/chat.route.js";
import messageRoute from "./routes/message.route.js";

const app = express();

app.get("/home", (req, res) => {
  res.send("Welcome to the project!");
});
app.get("/backend", (req, res) => {
  res.send("Welcome to the backend!");
});

app.get("/ping", (req, res) => {
  res.send("up dre s");
});

app.get("/hello", (req, res) => {
  res.send("Hello there!");
});

app.get("/random-number", (req, res) => {
  const num = Math.floor(Math.random() * 100);
  res.send("Your random number is: " + num);
});

app.get("/about", (req, res) => {
  res.send("This is a backend API made by me.");
});

app.use(express.static("public"));

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/posts", postRoute);
app.use("/api/test", testRoute);
app.use("/api/chats", chatRoute);
app.use("/api/messages", messageRoute);

app.listen(4000, () => {
  console.log("Server is running!");
});
