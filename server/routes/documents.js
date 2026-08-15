const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');

const STANDARDS_DOCS = [
  {
    id: 'sgcc-sd-211',
    title: 'SGCC SD-211 Guidance Standard',
    subtitle: 'Guidance for SGCC Quality Assurance Production Testing',
    category: 'Tempered Glass',
    authority: 'Safety Glazing Certification Council (SGCC)',
    filename: 'SGCC-SD-211-Guidance-Standard.pdf',
    relativePath: '/docs/standards/SGCC-SD-211-Guidance-Standard.pdf',
    description: 'Mandatory production testing rules for fully tempered glass. Details sampling frequency (first of thickness per shift), center punch 13mm edge procedure, and 10-piece max particle weight specifications.',
    standardCode: 'SGCC SD-211 / ANSI Z97.1 / CPSC 16 CFR 1201'
  },
  {
    id: 'astm-c1651',
    title: 'ASTM C1651 Standard Test Method',
    subtitle: 'Measurement of Roll Wave Optical Distortion in Heat-Treated Flat Glass',
    category: 'Roll Wave Distortion',
    authority: 'ASTM International',
    filename: 'ASTM-C1651.pdf',
    relativePath: '/docs/standards/ASTM-C1651.pdf',
    description: 'Standard test method for out-of-plane roll wave depth (W) and wavelength (L) measurement using Flat Bottom and 3-Point Contact Gauges, and calculating optical distortion (D) in millidiopters (mdpt).',
    standardCode: 'ASTM C1651-11'
  },
  {
    id: 'astm-f3007',
    title: 'ASTM F3007-13 Standard Test Method',
    subtitle: 'Ball Drop Impact Testing for Laminated Safety Glass',
    category: 'Laminated Glass',
    authority: 'ASTM International',
    filename: null,
    relativePath: null,
    description: 'Standard test method for evaluation of impact resistance and safety performance of laminated architectural flat glass via 5 lb steel ball drop impact testing across Categories 1-4.',
    standardCode: 'ASTM F3007-13'
  }
];

// GET /api/documents - List reference documents
router.get('/', authenticateToken, (req, res) => {
  const docsWithStatus = STANDARDS_DOCS.map(doc => {
    let fileSize = null;
    let available = false;

    if (doc.filename) {
      const fullPath = path.join(__dirname, '../../docs/standards', doc.filename);
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        fileSize = `${(stats.size / 1024 / 1024).toFixed(2)} MB`;
        available = true;
      }
    }

    return {
      ...doc,
      available,
      fileSize
    };
  });

  res.json(docsWithStatus);
});

module.exports = router;
