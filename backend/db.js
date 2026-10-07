import mysql from "mysql2";

export const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Ashi",
  database: "studyplanner"
});

db.connect((err) => {
  if(err){
    console.log(err);
  }else{
    console.log("Database Connected");
  }
});