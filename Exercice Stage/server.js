//EXERCICE POUR LE STAGE CHEZ DÉMOCRATIK
//Fait par Hugo Savard

const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());

// Connexion to database
const db = mysql.createConnection({
    host: 'localhost',
    user: '',                         //ADD YOUR USER
    password: '',                     //ADD YOUR PASSWORD
    database: 'election_db'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to database.');
});

// Election
//Create election
app.post('/Elections', (req, res) => {
    const { title, date } = req.body;
    if (!title || !date) {
        return res.status(400).json({ error: 'Title and date are required.' });
    }
    if (title.length < 50) {
        return res.status(400).json({ error: 'Title must be under 50 characters.' });
    }
    const sql = 'INSERT INTO Elections (title, date) VALUES (?, ?)';
    db.query(sql, [title, date], (err, result) => {
        if (err) throw err;
        res.status(201).json({ message: 'Election created.', id: result.insertId });
    });
});

//Get all elections
app.get('/Elections', (req, res) => {
    const sql = 'SELECT * FROM Elections';
    db.query(sql, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

//Get one election
app.get('/Elections/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM Elections WHERE id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) throw err;
        if (result.length === 0) {
            return res.status(404).json({ error: 'Election not found.' });
        }
        res.json(result[0]);
    });
});

//Candidate
//Create candidate for an election
app.post('/Elections/:id/Candidates', (req, res) => {
    const { id } = req.params;
    const { last_name, first_name } = req.body;
    if (!last_name || !first_name) {
        return res.status(400).json({ error: 'First name and last name are required.' });
    }
    if (last_name.length > 30) {
        return res.status(400).json({ error: 'Last name must be less than 30 characters.' });
    }
    if (first_name.length > 30) {
        return res.status(400).json({ error: 'First name must be less than 30 characters.' });
    }
    const sql = 'INSERT INTO Candidates (election_id, last_name, first_name) VALUES (?, ?, ?)';
    db.query(sql, [id, last_name, first_name], (err, result) => {
        if (err) throw err;
        res.status(201).json({ message: 'Candidate created.', id: result.insertId });
    });
});

//Get candidate for an election
app.get('/Elections/:id/Candidates', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM Candidates WHERE election_id = ?';
    db.query(sql, [id], (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

//Electors
//Create elector
app.post('/Electors', validateEmail, (req, res) => {
    const { last_name, first_name, email } = req.body;
    if (!last_name || !first_name || !email) {
        return res.status(400).json({ error: 'First name and last name are required.' });
    }
    if(!email){
        return res.status(400).json({ error: 'email is required.' });
    }
    if (last_name.length > 30) {
        return res.status(400).json({ error: 'Last name must be less than 30 characters.' });
    }
    if (first_name.length > 30) {
        return res.status(400).json({ error: 'First name must be less than 30 characters.' });
    }
    //Email verification is missing
    const sql = 'INSERT INTO Electors (last_name, first_name, email) VALUES (?, ?, ?)';
    db.query(sql, [last_name, first_name, email], (err, result) => {
        if (err) throw err;
        res.status(201).json({ message: 'Elector created.', id: result.insertId });
    });
});

//Get all elector
app.get('/Electors', (req, res) => {
    const sql = 'SELECT * FROM Electors';
    db.query(sql, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

//Validate email
function validateEmail(req, res, next) {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Email is required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format.' });
    }

    next();
}


//Vote
//Create vote for elector
app.post('/Elections/:electionId/Votes', authenticateElector, (req, res) => {
    const { electionId } = req.params;
    const { elector_id, candidate_id } = req.body;
    if (!elector_id || !candidate_id) {
        return res.status(400).json({ error: 'Elector and candidate are required.' });
    }
    //Check if elector already voted for the election
    const checkSql = 'SELECT * FROM votes WHERE election_id = ? AND elector_id = ?';
    db.query(checkSql, [electionId, elector_id], (err, results) => {
        if (err) throw err;
        if (results.length > 0) {
            return res.status(400).json({ error: 'Elector already voted.' });
        }
        const sql = 'INSERT INTO votes (election_id, candidate_id, elector_id) VALUES (?, ?, ?)';
        db.query(sql, [electionId, candidate_id, elector_id], (err, result) => {
            if (err) throw err;
            res.status(201).json({ message: 'Vote created.' });
        });
    });
});

//Get results for an election
app.get('/Elections/:id/results', (req, res) => {
    const { id } = req.params;
    const sql = `
        SELECT c.last_name, c.first_name, COUNT(v.id) AS votes
        FROM Candidates c
        LEFT JOIN Votes v ON c.id = v.candidate_id
        WHERE c.election_id = ?
        GROUP BY c.id
        ORDER BY votes DESC
    `;
    db.query(sql, [id], (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

// Vote authentification
function authenticateElector(req, res, next) {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Email is required for authentication.' });
    }
    const sql = 'SELECT * FROM Electors WHERE email = ?';
    db.query(sql, [email], (err, results) => {
        if (err) return next(err);
        if (results.length === 0) {
            return res.status(401).json({ error: 'Elector not found.' });
        }
        req.elector = results[0];
        next();
    });
}


const PORT = 3000;
app.listen(PORT, () => {
});
