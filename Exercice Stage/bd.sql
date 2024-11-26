CREATE TABLE Elections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    date DATE NOT NULL
);

CREATE TABLE Candidates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    last_name VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    election_id INT NOT NULL,
    FOREIGN KEY (election_id) REFERENCES Elections (id)
);

CREATE TABLE Electors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    last_name VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE Votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    elector_id INT NOT NULL,
    candidate_id INT NOT NULL,
    election_id INT NOT NULL,
    UNIQUE (elector_id, election_id),
    FOREIGN KEY (elector_id) REFERENCES Electors (id),
    FOREIGN KEY (candidate_id) REFERENCES Candidates (id),
    FOREIGN KEY (election_id) REFERENCES Elections (id)
);