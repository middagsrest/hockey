import express, { Express, Request, Response } from "express";
import mysql from "mysql";
import { Match } from "../../common/types";

const pool = mysql.createPool({
  connectionLimit: 5,
  host:"db",
  port: 3306,
  user:"user",
  password:"pass",
  database: "hockey"
})
const log = {
  info: (msg: string) => console.log(new Date().toISOString() + " INFO " + msg),
  warn:  (msg: string) => console.warn(new Date().toISOString() + " WARN " + msg),
}



pool.getConnection((err, c) => {
  if (err) return log.warn(err.message);
  c.query(`CREATE TABLE IF NOT EXISTS HockeyMatch (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT, 
      data JSON NOT NULL,
      primary key (id)
  )`, (err) => {
      if (err) {
        console.warn(err);
        log.warn(err.message);
        process.exit(1);
      }
      console.log("Table created");
      const match: Match = {
        id:1,
        home: {
          name: "New York Rangers",
          score: 5,
          shots: 30,
        },
        away : {
          name: "Pittsburgh Penguins",
          score: 2,
          shots: 25,
        }
      }
      c.query("DELETE FROM HockeyMatch WHERE id >=" + match.id, (err) => {
        if (err) return log.warn(err.message);
        c.query("INSERT INTO HockeyMatch SET id="+ match.id + ", data='"+ JSON.stringify(match) +"'", (err, result) => {
          if (err) return log.warn(err.message);
          log.info("Inserted match with id " + result.insertId);
        });
      });
  })
})

const app: Express = express();

app.use(express.json());

app.get("/api/matches", (req: Request, res: Response) => {
  pool.query("SELECT * FROM HockeyMatch", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map((row : { id: number, data: string }) => {
      const match = JSON.parse(row.data) as Match;
      match.id = row.id;
      return match;
    }));
  });
});

app.get("/api/matches/:id", (req: Request, res: Response) => {
  pool.query("SELECT * FROM HockeyMatch WHERE id = " + req.params.id, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map((row : { id: number, data: string }) => {
      const match = JSON.parse(row.data) as Match;
      match.id = row.id;
      return match;
    })[0]);
  });
});

app.post("/api/matches", (req: Request, res: Response) => {
  pool.query("INSERT INTO HockeyMatch SET data='"+ JSON.stringify(req.body) +"'", (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: result.insertId });
  });
});


app.listen(8080);

process.on('SIGINT', () => {
  log.info('Received SIGINT. Exiting');
  process.exit();
});
process.on('SIGTERM', () => {
  log.info('Received SIGTERM. Exiting');
  process.exit();
});

