const express = require('express');
const { Op, fn, col, literal } = require('sequelize');
const { sequelize, Assessment, User } = require('../models');
const authenticate = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

const router = express.Router();
router.use(authenticate);
router.use(requireRole('manager', 'senior_manager'));

const isPostgres = sequelize.getDialect() === 'postgres';

// Summary counts
router.get('/summary', async (req, res) => {
  try {
    const where = { deletedAt: null };

    const total = await Assessment.count({ where });
    const byStatus = await Assessment.findAll({
      where,
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true,
    });
    const byRisk = await Assessment.findAll({
      where: { ...where, overallMatchChallenge: { [Op.ne]: null } },
      attributes: ['overallMatchChallenge', [fn('COUNT', col('id')), 'count']],
      group: ['overallMatchChallenge'],
      raw: true,
    });
    const byRecommendation = await Assessment.findAll({
      where: { ...where, finalRecommendation: { [Op.ne]: null } },
      attributes: ['finalRecommendation', [fn('COUNT', col('id')), 'count']],
      group: ['finalRecommendation'],
      raw: true,
    });

    res.json({ total, byStatus, byRisk, byRecommendation });
  } catch (err) {
    console.error('Summary error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Trends over time (monthly)
router.get('/trends', async (req, res) => {
  try {
    let trends;
    if (isPostgres) {
      trends = await Assessment.findAll({
        where: { deletedAt: null },
        attributes: [
          [fn('DATE_TRUNC', 'month', col('createdAt')), 'month'],
          [fn('COUNT', col('id')), 'count'],
        ],
        group: [fn('DATE_TRUNC', 'month', col('createdAt'))],
        order: [[fn('DATE_TRUNC', 'month', col('createdAt')), 'ASC']],
        raw: true,
      });
    } else {
      // SQLite fallback
      trends = await Assessment.findAll({
        where: { deletedAt: null },
        attributes: [
          [fn('strftime', '%Y-%m-01', col('createdAt')), 'month'],
          [fn('COUNT', col('id')), 'count'],
        ],
        group: [fn('strftime', '%Y-%m-01', col('createdAt'))],
        order: [[fn('strftime', '%Y-%m-01', col('createdAt')), 'ASC']],
        raw: true,
      });
    }

    res.json(trends);
  } catch (err) {
    console.error('Trends error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Stats per assessor
router.get('/assessors', async (req, res) => {
  try {
    // Use simple approach that works with both SQLite and PostgreSQL
    const assessments = await Assessment.findAll({
      where: { deletedAt: null },
      include: [{ model: User, as: 'assessor', attributes: ['id', 'fullName'] }],
      raw: true,
      nest: true,
    });

    // Aggregate in JS for cross-DB compatibility
    const statsMap = {};
    for (const a of assessments) {
      const key = a.assessorId;
      if (!statsMap[key]) {
        statsMap[key] = {
          assessorId: key,
          assessor: { fullName: a.assessor?.fullName || 'Unknown' },
          totalAssessments: 0,
          approved: 0,
          drafts: 0,
        };
      }
      statsMap[key].totalAssessments++;
      if (a.status === 'approved') statsMap[key].approved++;
      if (a.status === 'draft') statsMap[key].drafts++;
    }

    res.json(Object.values(statsMap));
  } catch (err) {
    console.error('Assessor stats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Override frequency
router.get('/overrides', async (req, res) => {
  try {
    const total = await Assessment.count({ where: { deletedAt: null } });
    const withOverride = await Assessment.count({
      where: {
        deletedAt: null,
        professionalJudgementOverride: { [Op.ne]: null },
      },
    });

    const overrides = await Assessment.findAll({
      where: {
        deletedAt: null,
        professionalJudgementOverride: { [Op.ne]: null },
      },
      attributes: ['id', 'applicantName', 'professionalJudgementOverride', 'createdAt'],
      include: [{ model: User, as: 'assessor', attributes: ['fullName'] }],
      order: [['createdAt', 'DESC']],
    });

    res.json({ total, withOverride, overrideRate: total > 0 ? (withOverride / total * 100).toFixed(1) : 0, overrides });
  } catch (err) {
    console.error('Overrides error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// CSV export
router.get('/export', async (req, res) => {
  try {
    const assessments = await Assessment.findAll({
      where: { deletedAt: null },
      include: [{ model: User, as: 'assessor', attributes: ['fullName'] }],
      order: [['createdAt', 'DESC']],
    });

    const csv = [
      'ID,Applicant,Assessor,Status,Housing Need,Gross Challenge,Residual Challenge,Overall Match,Recommendation,Created,Updated',
      ...assessments.map(a =>
        `${a.id},"${a.applicantName}","${a.assessor?.fullName || ''}","${a.status}","${a.housingNeedRating || ''}","${a.grossChallengeRating || ''}","${a.residualChallengeRating || ''}","${a.overallMatchChallenge || ''}","${a.finalRecommendation || ''}","${new Date(a.createdAt).toISOString()}","${new Date(a.updatedAt).toISOString()}"`
      ),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=assessments-export.csv');
    res.send(csv);
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
