INSERT INTO patients(username, dob, return, status)
VALUES ('mkomaiha', '04/19/1997', '03/18/2019', 'Complete'),
('test1', '04/10/1900', '03/20/2019', 'In-Progress'),
('test2', '04/19/1997', '03/21/2019', 'Unbegun'),
('test3', '05/11/1910', '03/22/2019', 'In-Progress'),
('test4', '05/11/1910', '03/22/2019', 'In-Progress');
--
INSERT INTO sessions(squeezeCount, sessionDuration, forcePerSqueeze, forceDuringSqueeze, owner)
VALUES ('64', '10.123', '102.32', '87.33', 'mkomaiha');
-- ('0', '60.32', '76.2', '34.2', 'test1'),
-- ('10', '43.23', '23.2', '10', 'test4'),
-- ('20', '123.32', '12.32', '5.3', 'test3');
--
INSERT INTO sessions(squeezeCount, sessionDuration, forcePerSqueeze, forceDuringSqueeze, owner, created)
VALUES
('10', '-23', '324', '203', 'mkomaiha', '2019-04-05 23:59:59'),
('20', '-23', '324', '203', 'mkomaiha', '2019-04-07 23:59:59'),
('20', '-23', '324', '203', 'mkomaiha', '2019-04-10 23:59:59');
