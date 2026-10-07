import express from "express";
import { db } from "../db.js";

const router = express.Router();

/* ==================================
   ADD SUBJECT + GENERATE SCHEDULE
================================== */

router.post("/subjects", (req, res) => {
  const {
    name,
    deadline,
    totalHours,
    examDate
  } = req.body;

  const sql =
    `INSERT INTO subjects
    (name, deadline, total_hours, exam_date)
    VALUES (?, ?, ?, ?)`;

  db.query(
    sql,
    [name, deadline, totalHours, examDate],
    (err, result) => {

      if (err) {
        console.log(err);
        return res.status(500).json(err);
      }

      const subjectId =
        result.insertId;

      generateSchedule(
        subjectId,
        deadline,
        totalHours
      );

      res.json({
        message:
          "Subject Added & Schedule Generated"
      });
    }
  );
});

/* ==================================
   GENERATE DAILY SCHEDULE
================================== */

function generateSchedule(
  subjectId,
  deadline,
  totalHours
) {

  const today =
    new Date();

  const endDate =
    new Date(deadline);

  const diffDays =
    Math.ceil(
      (endDate - today) /
      (1000 * 60 * 60 * 24)
    );

  if (diffDays <= 0) return;

  const dailyHours =
    Math.ceil(
      totalHours / diffDays
    );

  for (
    let i = 1;
    i <= diffDays;
    i++
  ) {

    const studyDate =
      new Date();

    studyDate.setDate(
      studyDate.getDate() + i
    );

    db.query(
      `
      INSERT INTO schedules
      (
        subject_id,
        study_date,
        hours,
        status
      )
      VALUES (?, ?, ?, ?)
      `,
      [
        subjectId,
        studyDate
          .toISOString()
          .split("T")[0],
        dailyHours,
        "Pending"
      ]
    );
  }
}

/* ==================================
   GET ALL SCHEDULES
================================== */

router.get("/schedule", (req, res) => {

  const sql = `
    SELECT
schedules.id,
schedules.study_date,
schedules.hours,
schedules.status,
subjects.name,
subjects.exam_date
    FROM schedules
    JOIN subjects
    ON schedules.subject_id =
       subjects.id
    ORDER BY schedules.study_date
  `;

  db.query(
    sql,
    (err, data) => {

      if (err) {
        console.log(err);
        return res.status(500).json(err);
      }

      res.json(data);
    }
  );
});

/* ==================================
   COMPLETE TASK
================================== */

router.put(
  "/complete/:id",
  (req, res) => {

    const id =
      req.params.id;

    db.query(
      `
      UPDATE schedules
      SET status='Completed'
      WHERE id=?
      `,
      [id],
      (err, result) => {

        if (err) {
          console.log(err);
          return res.status(500).json(err);
        }

        res.json({
          message:
            "Task Completed"
        });
      }
    );
  }
);

/* ==================================
   NOT COMPLETED TODAY
   MOVE TO NEXT DAY
================================== */
router.put("/reschedule/:id", (req, res) => {

  const id = req.params.id;

  db.query(
    "SELECT * FROM schedules WHERE id=?",
    [id],
    (err, data) => {

      if (err) {
        return res.status(500).json(err);
      }

      if (data.length === 0) {
        return res.status(404).json({
          message: "Task Not Found"
        });
      }

      const task = data[0];

      const nextDate = new Date(task.study_date);

      nextDate.setDate(
        nextDate.getDate() + 1
      );

      const formattedDate =
        nextDate
          .toISOString()
          .split("T")[0];

      db.query(
        `
        SELECT *
        FROM schedules
        WHERE subject_id=?
        AND study_date=?
        `,
        [
          task.subject_id,
          formattedDate
        ],
        (
          findErr,
          existing
        ) => {

          if (findErr) {
            return res
              .status(500)
              .json(findErr);
          }

          if (
            existing.length > 0
          ) {

            db.query(
              `
              UPDATE schedules
              SET hours =
              hours + ?
              WHERE id=?
              `,
              [
                task.hours,
                existing[0].id
              ],
              (updateErr) => {

                if (updateErr) {
                  return res
                    .status(500)
                    .json(updateErr);
                }

                db.query(
                  `
                  UPDATE schedules
SET status='Missed'
WHERE id=?
                  `,
                  [id]
                );

                res.json({
                  message:
                  "Hours Added To Next Day"
                });
              }
            );

          } else {

            db.query(
              `
              INSERT INTO schedules
              (
                subject_id,
                study_date,
                hours,
                status
              )
              VALUES
              (?, ?, ?, ?)
              `,
              [
                task.subject_id,
                formattedDate,
                task.hours,
                "Pending"
              ],
              (insertErr) => {

                if (insertErr) {
                  return res
                    .status(500)
                    .json(insertErr);
                }

                db.query(
                  `
                  UPDATE schedules
SET status='Missed'
WHERE id=?
                  `,
                  [id]
                );

                res.json({
                  message:
                  "Moved To Next Day"
                });
              }
            );

          }

        }
      );

    }
  );

});

router.get("/calendar", (req, res) => {

  const sql = `
    SELECT
      schedules.study_date,
      schedules.hours,
      schedules.status,
      subjects.name,
      subjects.exam_date
    FROM schedules
    JOIN subjects
    ON schedules.subject_id = subjects.id
  `;

  db.query(sql, (err, data) => {

    if (err) {
      return res.status(500).json(err);
    }

    res.json(data);
  });
});

export default router;