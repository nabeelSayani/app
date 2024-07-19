const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const port = 3000;

// MySQL Connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'obituary_platform'
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL: ' + err.stack);
        return;
    }
    console.log('Connected to MySQL database as id ' + connection.threadId);
});

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));

// Serve the obituary form
app.get('/submit_obituary_form', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'obituary_form.html'));
});

// Submit Obituary Form
app.post('/submit_obituary', (req, res) => {
    const { name, date_of_birth, date_of_death, content, author } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const sql = 'INSERT INTO obituaries (name, date_of_birth, date_of_death, content, author, slug) VALUES (?, ?, ?, ?, ?, ?)';
    connection.query(sql, [name, date_of_birth, date_of_death, content, author, slug], (err, result) => {
        if (err) {
            console.error('Error submitting obituary: ' + err.stack);
            res.status(500).send('Error submitting obituary.');
            return;
        }
        res.send('<script>alert("Obituary submitted successfully."); window.location.href="/view_obituaries";</script>');
    });
});

// View Obituaries
app.get('/view_obituaries', (req, res) => {
    const sql = 'SELECT * FROM obituaries ORDER BY submission_date DESC';
    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error retrieving obituaries: ' + err.stack);
            res.status(500).send('Error retrieving obituaries.');
            return;
        }
        let html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Obituaries</title>
                <link rel="stylesheet" href="/styles.css">
                <meta name="description" content="Obituaries and remembrances.">
                <meta name="keywords" content="obituaries, remembrances, memorials">
                <meta property="og:title" content="Obituaries">
                <meta property="og:description" content="Obituaries and remembrances.">
                <meta property="og:type" content="website">
                <meta property="og:url" content="http://localhost:${port}/view_obituaries">
                <meta property="og:image" content="/path/to/image.jpg">
                <link rel="canonical" href="http://localhost:${port}/view_obituaries">
            </head>
            <body>
                <nav>
                    <ul>
                        <li><a href="/submit_obituary_form">Submit Obituary</a></li>
                        <li><a href="/view_obituaries">View Obituaries</a></li>
                    </ul>
                </nav>
                <h1>Obituaries</h1>
                <div class="obituaries-container">`;

        results.forEach(obituary => {
            html += `
                    <article>
                        <header>
                            <h2>${obituary.name}</h2>
                        </header>
                        <p><strong>Date of Birth:</strong> ${obituary.date_of_birth}</p>
                        <p><strong>Date of Death:</strong> ${obituary.date_of_death}</p>
                        <p>${obituary.content}</p>
                        <footer>
                            <p><strong>Author:</strong> ${obituary.author}</p>
                            <p><strong>Submission Date:</strong> ${obituary.submission_date}</p>
                        </footer>
                        <div class="social-share">
                            <a href="https://www.facebook.com/sharer/sharer.php?u=http://localhost:${port}/view_obituaries/${obituary.slug}" target="_blank">Share on Facebook</a>
                            <a href="https://twitter.com/intent/tweet?url=http://localhost:${port}/view_obituaries/${obituary.slug}&text=Check out this obituary: ${obituary.name}" target="_blank">Share on Twitter</a>
                        </div>
                    </article>`;
        });

        html += `
                </div>
            </body>
            </html>`;
        res.send(html);
    });
});

// Start Server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
