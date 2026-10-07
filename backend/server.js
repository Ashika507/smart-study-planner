import express from "express";
import cors from "cors";
import plannerRoutes from "./routes/planner.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", plannerRoutes);

app.listen(5000, () => {
  console.log("Server Running on Port 5000");
});