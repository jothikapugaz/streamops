INSERT INTO titles (title, type, genre, region, availability, release_date) VALUES
('Moon Harbor', 'Series', 'Mystery', 'Global', 'Available', '2026-09-12'),
('The Last Signal', 'Film', 'Science Fiction', 'Global', 'Available', '2026-08-04'),
('Paper Planets', 'Series', 'Drama', 'Asia-Pacific', 'Coming Soon', '2026-11-18');

INSERT INTO incidents (title, service, severity, status, description) VALUES
('Playback start failures on selected devices', 'Playback API', 'High', 'Investigating', 'Sample issue affecting playback initiation.'),
('Catalogue metadata response is slow', 'Content API', 'Medium', 'Open', 'Sample elevated response times on metadata requests.'),
('Recommendation cache refreshed', 'Recommendations', 'Low', 'Resolved', 'Sample incident resolved after a cache refresh.');