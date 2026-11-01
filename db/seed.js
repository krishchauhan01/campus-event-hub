const bcrypt = require('bcryptjs');
const db = require('./index');

const hash = (plain) => bcrypt.hashSync(plain, 10);
const pad = (n) => String(n).padStart(2, '0');

function at(days, hour = 18) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(hour)}:00`;
}

db.exec('DELETE FROM reviews; DELETE FROM rsvps; DELETE FROM events; DELETE FROM users;');
try {
  db.exec("DELETE FROM sqlite_sequence WHERE name IN ('users','events','rsvps','reviews')");
} catch { /* sqlite_sequence only exists after the first insert */ }

const addUser = db.prepare('INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)');
addUser.run('Aisha Khan', 'admin@campus.edu', hash('Admin@123'), 'admin');
const org1 = addUser.run('Rafiq Hasan', 'organizer@campus.edu', hash('Organizer@123'), 'organizer').lastInsertRowid;
const org2 = addUser.run('Meera Das', 'arts@campus.edu', hash('Organizer@123'), 'organizer').lastInsertRowid;
const stu = addUser.run('Sadia Rahman', 'student@campus.edu', hash('Student@123'), 'student').lastInsertRowid;
const stu2 = addUser.run('Tanvir Ahmed', 'tanvir@campus.edu', hash('Student@123'), 'student').lastInsertRowid;

const addEvent = db.prepare(`INSERT INTO events
  (title, description, category, location, starts_at, ends_at, capacity, organizer_id, status)
  VALUES (?,?,?,?,?,?,?,?,?)`);

const events = [
  ['Intro to Web Accessibility', 'A hands-on workshop on semantic HTML, labels, contrast and keyboard access. Bring a laptop and an existing page to improve.', 'Academic', 'Lab 204, CSE Building', at(3, 14), at(3, 16), 30, org1, 'approved'],
  ['Inter Department Football Final', 'Cheer for your department in the annual football final. Free entry with student ID, gates open thirty minutes early.', 'Sports', 'Main Ground', at(5, 16), at(5, 18), 200, org2, 'approved'],
  ['Campus Cultural Night', 'An evening of music, dance and drama performed by student clubs, followed by a shared dinner in the courtyard.', 'Arts', 'Auditorium', at(8, 18), at(8, 21), 150, org2, 'approved'],
  ['Career Fair: Tech and Design', 'Meet recruiters from twelve companies, get your CV reviewed and practise a two minute introduction.', 'Career', 'Convention Hall', at(11, 10), at(11, 16), 120, org1, 'approved'],
  ['Chess Club Open Tournament', 'Swiss style tournament, five rounds, all skill levels welcome. Boards and clocks provided.', 'Sports', 'Student Centre, Room 3', at(14, 15), at(14, 19), 40, org2, 'approved'],
  ['Photography Walk: Old Campus', 'A slow guided walk through the heritage buildings with tips on light and composition. Phones welcome.', 'Arts', 'Meet at North Gate', at(17, 8), at(17, 10), 25, org2, 'approved'],
  ['Freshers Welcome Mixer', 'Meet your batchmates, find clubs to join and grab snacks. Short welcome talk at the start.', 'Social', 'Student Lounge', at(20, 17), at(20, 20), 80, org1, 'approved'],
  ['Python Study Circle', 'Weekly peer study session working through data structures exercises together. Beginners welcome.', 'Academic', 'Library Seminar Room', at(2, 17), at(2, 19), 35, org1, 'approved'],
  ['Hackathon Planning Meeting', 'Organisers only: review the schedule, sponsors and volunteer rota for the spring hackathon.', 'Academic', 'Room 101', at(6, 15), at(6, 16), 20, org1, 'pending'],
  ['Sunrise Yoga Session', 'Start the day with gentle yoga on the lawn. Mats provided, wear comfortable clothes.', 'Sports', 'East Lawn', at(9, 7), at(9, 8), 30, org2, 'rejected'],
];

const ids = events.map((e) => addEvent.run(...e).lastInsertRowid);

const addRsvp = db.prepare("INSERT INTO rsvps (event_id,user_id,status) VALUES (?,?,'going')");
addRsvp.run(ids[0], stu);
addRsvp.run(ids[1], stu);
addRsvp.run(ids[2], stu);
addRsvp.run(ids[3], stu);
addRsvp.run(ids[0], stu2);
addRsvp.run(ids[2], stu2);

const addReview = db.prepare('INSERT INTO reviews (event_id,user_id,rating,comment) VALUES (?,?,?,?)');
addReview.run(ids[1], stu, 5, 'Well organised and the atmosphere was brilliant. More seating next time please.');
addReview.run(ids[1], stu2, 4, 'Great match. The queues for snacks were a bit long.');
addReview.run(ids[3], stu, 5, 'I got two interview calls from this fair. Very useful.');
addReview.run(ids[2], stu2, 4, 'Lovely performances, though the sound could be clearer at the back.');

console.log(`Seeded ${events.length} events, 4 users and demo RSVPs.`);
console.log('Logins: admin@campus.edu / Admin@123  |  organizer@campus.edu / Organizer@123  |  student@campus.edu / Student@123');
