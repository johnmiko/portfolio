import React, { useState } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Link,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const calculateMonthsDuration = (startDate: Date): string => {
  const now = new Date();
  let months = (now.getFullYear() - startDate.getFullYear()) * 12;
  months += now.getMonth() - startDate.getMonth();
  
  // Adjust if we haven't reached the anniversary date this month
  if (now.getDate() < startDate.getDate()) {
    months--;
  }
  
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  
  if (years > 0) {
    return `${years} year${years > 1 ? 's' : ''} ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
  }
  return `${months} month${months !== 1 ? 's' : ''}`;
};

const Resume: React.FC = () => {
  const [fontFamily, setFontFamily] = useState('Arial');

  const handleFontChange = (event: SelectChangeEvent) => {
    setFontFamily(event.target.value);
  };

  const skills = [
    'Python (10.0 years)', 'SQL (2.7 years)', 'VBA (2.6 years)', 'React (1.5 years)',
    'Java (1.2 years)', 'Matlab (1.2 years)', 'C# (0.9 years)', 'PHP (0.7 years)',
    'Kotlin (0.7 years)', 'R (0.4 years)', 'C++ (0.3 years)'
  ];

  const workTypes = [
    'Testing (5.8 years)', 'Automation (4.2 years)', 'Backend (3.7 years)',
    'Frontend (1.8 years)', 'Mentoring (1.2 years)'
  ];

  const keywords = ['Python', 'Backend Development', 'Automation Testing', 'Cloud Computing', 'Machine Learning'];

  const programmingExperience = [
    { label: 'Python', startYear: 2013, endYear: undefined },
    { label: 'Java', startYear: 2015, endYear: 2017 },
    { label: 'React', startYear: 2021, endYear: undefined },
    { label: 'SQL', startYear: 2014, endYear: undefined },
  ];

  const durationYears = (start: number, end?: number) => {
    const nowYear = new Date().getFullYear();
    return Math.max(0, (end ?? nowYear) - start);
  };

  const maxYears = Math.max(...programmingExperience.map((item) => durationYears(item.startYear, item.endYear)), 1);

  return (
    <Box sx={{ display: 'flex', gap: 3, p: 2, minHeight: '100vh', justifyContent: 'space-between' }}>
      {/* Resume centered */}
      <Paper sx={{ p: 3, fontFamily, width: '800px', flexShrink: 0 }}>

      <Typography variant="h3" component="h1" gutterBottom>
        JOHN (MICKEY) MIKO
      </Typography>
      <Typography variant="h5" component="h2" gutterBottom>
        Mechatronics Engineer
      </Typography>
      <Box sx={{ mb: 2 }}>
        <Link href="mailto:johnmiko4@gmail.com" sx={{ mr: 2 }}>johnmiko4@gmail.com</Link>·
        <Link href="tel:+15877002734" sx={{ mr: 2 }}>587-700-2734</Link>·
        <Link href="https://linkedin.com/in/john-miko" sx={{ mr: 2 }}>linkedin.com/in/john-miko</Link>·
        <Link href="https://github.com/johnmiko">github.com/johnmiko</Link>
      </Box>
      <Typography variant="body2" color="text.secondary">
        Revision 36
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Link href="#graphs">Graphs</Link>
      </Box>

      <Typography variant="h4" component="h2" gutterBottom sx={{ mt: 4 }}>
        Experience
      </Typography>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Senior Test Engineer - SMART Technologies</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" color="text.secondary">2025 – Present ({calculateMonthsDuration(new Date(2025, 0, 1))})</Typography>
          <ul>
            <li>Test lead on smartboard mini project, ensuring all critical bugs are resolved by release date.</li>
            <li>Automating interoperability tests and room control tests using Python.</li>
          </ul>
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Test Automation Engineer - SmartD</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" color="text.secondary">2023 – 2024 (1.5 years)</Typography>
          <ul>
            <li>Executed detailed automated tests on VFD motor controllers using Python; identified key issues and addressed three major causes of product crashes.</li>
            <li>Coordinated with cross-functional teams via Jira, reporting daily progress and leading retrospectives that uncovered critical issues and drove major software enhancements.</li>
            <li>Improved product reliability by reducing time to find integration bugs from 1 week to 1 day.</li>
            <li>Received a recommendation letter.</li>
          </ul>
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Backend Engineer - HiveStack</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" color="text.secondary">2022 (3 months)</Typography>
          <ul>
            <li>Refactored backend ad server to correctly handle ads in any time zone and daylight savings changes, reducing "no ad selection" issues by 5%.</li>
            <li>Received a recommendation letter.</li>
          </ul>
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Full-stack Engineer - Lone Wolf Technologies</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" color="text.secondary">2021 – 2022 (1 year)</Typography>
          <ul>
            <li>Designed features across front-end frameworks and back-end services, reducing onboarding workload for new clients by 30%.</li>
            <li>Investigated and fixed recurring system anomalies, streamlining troubleshooting and saving ~2 hours per incident.</li>
          </ul>
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Quantitative Analyst - Miko Software</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" color="text.secondary">2019 – 2022 (3 years)</Typography>
          <ul>
            <li>Engineered trade identification systems to analyze stock market metrics, achieving an average yearly return of 65%.</li>
            <li>Self-taught stock chart patterns, options trading, and quantitative analysis.</li>
          </ul>
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Full-stack Engineer - R3mote.io</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" color="text.secondary">2019 – 2020 (1 year)</Typography>
          <ul>
            <li>Developed automated testing for front-end and back-end components, integrated into CI/CD pipelines.</li>
            <li>Reduced application downtime by 25% through improved code quality and reliability.</li>
          </ul>
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Mechanical Engineer - Probe</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" color="text.secondary">2016 – 2019 (3 years)</Typography>
          <ul>
            <li>Designed oilfield tools and cut product development time by 35% by automating repetitive tasks.</li>
            <li>Improved reliability by applying appropriate mechanical standards (e.g., O-ring and spring design calculators).</li>
          </ul>
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Software Engineer – Intern - ABB</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" color="text.secondary">2014 – 2015 (1 year)</Typography>
          <ul>
            <li>Created a unit-testing framework for an electromagnetic solver, reducing bug-testing time from 3 days to 1 hour.</li>
          </ul>
        </AccordionDetails>
      </Accordion>

      <Typography variant="h4" component="h2" gutterBottom sx={{ mt: 4 }}>
        Projects
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Typography variant="h6">Super Normal Doctor's Office</Typography>
        <Typography variant="body2" color="text.secondary">2024 (6 months)</Typography>
        <ul>
          <li>Building a video game in Godot 4: an action-adventure where the player navigates a very unusual hospital to reach Dr. Super Normal for treatment.</li>
        </ul>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="h6">Netflix Closed Caption Remover</Typography>
        <Typography variant="body2" color="text.secondary">2024 (3 months)</Typography>
        <ul>
          <li>Chrome extension that removes non-dialogue captions from Netflix subtitles (e.g., "[inaudible dialogue]").</li>
        </ul>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="h6">Job Auto Applier</Typography>
        <Typography variant="body2" color="text.secondary">2021 – 2024 (2.5 years)</Typography>
        <ul>
          <li>LinkedIn web crawler using Python and Selenium to find and apply for jobs, filter poor matches, and answer application questions.</li>
          <li>Applied to 6000+ jobs and secured interviews at Lone Wolf and HiveStack using this tool.</li>
        </ul>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="h6">Dota Game Finder</Typography>
        <Typography variant="body2" color="text.secondary">2023 (6 months)</Typography>
        <ul>
          <li>Python tooling to find interesting Dota games using a 3rd-party API, GitHub Actions scheduling, and Pandas-based data analysis.</li>
        </ul>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="h6">Hockey Betting Algorithm</Typography>
        <Typography variant="body2" color="text.secondary">2017 – 2019 (3 years)</Typography>
        <ul>
          <li>Analyzed hockey player and team statistics with Python to better predict odds in games with a heavy favourite.</li>
          <li>Strategy delivered ~8% profit over the 2019 season when betting only on those games.</li>
        </ul>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="h6">Autonomous Robots</Typography>
        <Typography variant="body2" color="text.secondary">2015 – 2016 (1.5 years)</Typography>
        <ul>
          <li>Autonomous Robot Club: built a ground vehicle to navigate complex mazes using camera, lidar, and GPS.</li>
          <li>Used Matlab and machine learning to align camera and lidar data for joint navigation.</li>
          <li>4th-year design project: led a 12-engineer team to develop an autonomous underwater vehicle from prototype to version 1, ready for real-world testing.</li>
        </ul>
      </Box>

      <Typography variant="h4" component="h2" gutterBottom sx={{ mt: 4 }}>
        Skills
      </Typography>

      <Typography variant="h6">Type of Work (Years of Experience)</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        {workTypes.map((work) => (
          <Chip key={work} label={work} variant="outlined" />
        ))}
      </Box>

      <Typography variant="h6">Coding (Years of Experience)</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        {skills.map((skill) => (
          <Chip key={skill} label={skill} variant="outlined" />
        ))}
      </Box>

      <Typography variant="h6">Keywords</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {keywords.map((keyword) => (
          <Chip key={keyword} label={keyword} />
        ))}
      </Box>

      <Typography variant="h4" component="h2" gutterBottom sx={{ mt: 4 }}>
        Education
      </Typography>
      <Typography variant="body1">
        <strong>B.Sc. in Mechatronics Engineering</strong><br />
        University of Calgary · 2011 – 2016
      </Typography>
      <Box id="graphs" sx={{ mt: 6 }}>
        <Typography variant="h4" gutterBottom>Graphs</Typography>
        <Typography variant="subtitle1" gutterBottom>Programming experience over time</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
          {programmingExperience.map((item) => {
            const years = durationYears(item.startYear, item.endYear);
            const percent = Math.min(100, (years / maxYears) * 100);
            const label = item.endYear ? `${item.startYear}–${item.endYear}` : `${item.startYear}–Present`;
            return (
              <Box key={item.label}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {item.label}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ flex: 1, height: 10, bgcolor: 'grey.200', borderRadius: 1 }}>
                    <Box sx={{ width: `${percent}%`, height: '100%', bgcolor: 'primary.main', borderRadius: 1 }} />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {label} ({years} yr{years !== 1 ? 's' : ''})
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
        <Typography variant="subtitle1" gutterBottom>Timeline</Typography>
        <Box sx={{ my: 2 }}>
          <svg width="100%" height="140" viewBox="0 0 800 140">
            <line x1="60" y1="80" x2="740" y2="80" stroke="#1976d2" strokeWidth="3" />
            <circle cx="120" cy="80" r="6" fill="#1976d2" />
            <text x="100" y="60" fontSize="12">2011 Start university</text>
            <circle cx="360" cy="80" r="6" fill="#1976d2" />
            <text x="320" y="60" fontSize="12">2016 Received B.Sc</text>
            <circle cx="720" cy="80" r="6" fill="#1976d2" />
            <text x="700" y="60" fontSize="12">Present</text>
            <path d="M 420 30 v 35 q 0 10 10 10 h 180 q 10 0 10 -10 v -35" stroke="#d32f2f" strokeWidth="2" fill="none" />
            <text x="470" y="20" fontSize="12" fill="#d32f2f">Developing mold poisoning (2017–2024)</text>
          </svg>
        </Box>
        <Typography variant="caption" color="text.secondary">Graphs are illustrative; durations to "Present" update automatically.</Typography>
      </Box>
      </Paper>

      {/* Font selector on right - sticky */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          minWidth: '200px',
          position: 'sticky',
          top: 20,
          height: 'fit-content',
        }}
      >
        <FormControl fullWidth>
          <InputLabel>Resume Font</InputLabel>
          <Select value={fontFamily} label="Resume Font" onChange={handleFontChange}>
            <MenuItem value="Roboto">Roboto</MenuItem>
            <MenuItem value="Arial">Arial</MenuItem>
            <MenuItem value="Times New Roman">Times New Roman</MenuItem>
            <MenuItem value="Courier New">Courier New</MenuItem>
          </Select>
        </FormControl>
      </Box>
    </Box>
  );
};

export default Resume;