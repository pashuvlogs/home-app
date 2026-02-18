const express = require('express');
const { Op } = require('sequelize');
const { sequelize, Assessment, AuditLog, User, Notification } = require('../models');
const authenticate = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

const router = express.Router();
router.use(authenticate);

// Helper: create audit log
async function audit(assessmentId, userId, action, details = {}) {
  return AuditLog.create({ assessmentId, userId, action, details });
}

// Helper: create notification
async function notify(userId, assessmentId, type, message) {
  return Notification.create({ userId, assessmentId, type, message });
}

// Create new assessment
router.post('/', requireRole('assessor'), async (req, res) => {
  try {
    const { applicantName } = req.body;
    if (!applicantName) {
      return res.status(400).json({ error: 'Applicant name is required' });
    }

    const assessment = await Assessment.create({
      applicantName,
      assessorId: req.user.id,
      status: 'draft',
      currentPart: 1,
      formData: {
        part1: {
          applicantName,
          dateOfAssessment: new Date().toISOString().split('T')[0],
          assessorName: req.user.fullName,
        },
        part2: {}, part3: {}, part4: {}, part5: {}, part6: {}, part7: {}, part8: {},
      },
      lastSavedAt: new Date(),
      lastSavedPart: 1,
    });

    await audit(assessment.id, req.user.id, 'create', { applicantName });

    res.status(201).json(assessment);
  } catch (err) {
    console.error('Create assessment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// List assessments (role-filtered, includes deleted/rejected with reasons)
router.get('/', async (req, res) => {
  try {
    const where = {};
    const { role } = req.user;

    if (role === 'assessor') {
      where.assessorId = req.user.id;
    }
    // Managers and senior managers see all

    const assessments = await Assessment.findAll({
      where,
      include: [
        { model: User, as: 'assessor', attributes: ['id', 'fullName', 'username'] },
        { model: User, as: 'approver', attributes: ['id', 'fullName', 'role'] },
        { model: User, as: 'deleter', attributes: ['id', 'fullName'] },
      ],
      order: [['updatedAt', 'DESC']],
      paranoid: false, // Include soft-deleted assessments
    });

    res.json(assessments);
  } catch (err) {
    console.error('List assessments error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Search assessments
router.get('/search', async (req, res) => {
  try {
    const { q, status, risk, dateFrom, dateTo, assessor } = req.query;
    const where = { deletedAt: null };

    if (req.user.role === 'assessor') {
      where.assessorId = req.user.id;
    }

    if (q) {
      if (sequelize.getDialect() === 'postgres') {
        where.applicantName = { [Op.iLike]: `%${q}%` };
      } else {
        where.applicantName = { [Op.like]: `%${q}%` };
      }
    }
    if (status) {
      where.status = status;
    }
    if (risk) {
      where.overallMatchChallenge = risk;
    }
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt[Op.gte] = new Date(dateFrom);
      if (dateTo) where.createdAt[Op.lte] = new Date(dateTo + 'T23:59:59');
    }
    if (assessor && req.user.role !== 'assessor') {
      where.assessorId = assessor;
    }

    const assessments = await Assessment.findAll({
      where,
      include: [{ model: User, as: 'assessor', attributes: ['id', 'fullName', 'username'] }],
      order: [['updatedAt', 'DESC']],
    });

    res.json(assessments);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single assessment
router.get('/:id', async (req, res) => {
  try {
    const assessment = await Assessment.findByPk(req.params.id, {
      include: [
        { model: User, as: 'assessor', attributes: ['id', 'fullName', 'username'] },
        { model: User, as: 'approver', attributes: ['id', 'fullName', 'role'] },
        {
          model: AuditLog, as: 'auditLogs',
          include: [{ model: User, as: 'user', attributes: ['id', 'fullName'] }],
          order: [['createdAt', 'DESC']],
        },
        { model: Assessment, as: 'amendments' },
      ],
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    // Assessors can only view their own
    if (req.user.role === 'assessor' && assessment.assessorId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(assessment);
  } catch (err) {
    console.error('Get assessment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Save specific part
router.put('/:id/part/:partNum', async (req, res) => {
  try {
    const assessment = await Assessment.findByPk(req.params.id);
    if (!assessment) return res.status(404).json({ error: 'Assessment not found' });

    if (assessment.lockedAt) {
      return res.status(403).json({ error: 'Assessment is locked (approved)' });
    }

    if (req.user.role === 'assessor' && assessment.assessorId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const partNum = parseInt(req.params.partNum);
    if (partNum < 1 || partNum > 8) {
      return res.status(400).json({ error: 'Invalid part number' });
    }

    const partKey = `part${partNum}`;
    const formData = { ...assessment.formData };
    formData[partKey] = { ...formData[partKey], ...req.body.data };

    // Extract top-level ratings from parts
    const updates = {
      formData,
      lastSavedAt: new Date(),
      lastSavedPart: partNum,
      currentPart: Math.max(assessment.currentPart, partNum),
    };

    // Part 2: Housing Need Rating (auto-calculated)
    if (partNum === 2 && req.body.data.housingNeedRating) {
      updates.housingNeedRating = req.body.data.housingNeedRating;
    }
    // Part 7: Summary — extract gross, residual, overall
    if (partNum === 7) {
      if (req.body.data.grossChallengeRating) {
        updates.grossChallengeRating = req.body.data.grossChallengeRating;
      }
      if (req.body.data.residualChallengeRating) {
        updates.residualChallengeRating = req.body.data.residualChallengeRating;
      }
      if (req.body.data.overallMatchChallenge) {
        updates.overallMatchChallenge = req.body.data.overallMatchChallenge;
      }
    }
    // Part 8: Approval — extract final recommendation
    if (partNum === 8) {
      if (req.body.data.finalRecommendation) {
        updates.finalRecommendation = req.body.data.finalRecommendation;
      }
    }

    await assessment.update(updates);
    await audit(assessment.id, req.user.id, 'save', { partNumber: partNum });

    const updated = await Assessment.findByPk(assessment.id, {
      include: [{ model: User, as: 'assessor', attributes: ['id', 'fullName', 'username'] }],
    });

    res.json(updated);
  } catch (err) {
    console.error('Save part error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Submit for approval
router.post('/:id/submit', async (req, res) => {
  try {
    const assessment = await Assessment.findByPk(req.params.id);
    if (!assessment) return res.status(404).json({ error: 'Assessment not found' });

    if (assessment.assessorId !== req.user.id) {
      return res.status(403).json({ error: 'Only the assessor can submit' });
    }

    // Determine approval pathway based on tenancy risk (now in part8)
    const tenancyRisk = assessment.formData.part8?.tenancyRisk || assessment.formData.part6?.tenancyRisk || assessment.overallMatchChallenge;
    let newStatus;

    if (tenancyRisk === 'High') {
      newStatus = 'pending_senior';
    } else if (tenancyRisk === 'Medium') {
      newStatus = 'pending_manager';
    } else {
      // Low risk - frontline approval
      newStatus = 'approved';
      assessment.lockedAt = new Date();
      assessment.lockedBy = req.user.id;
    }

    await assessment.update({ status: newStatus, lockedAt: assessment.lockedAt, lockedBy: assessment.lockedBy });
    await audit(assessment.id, req.user.id, 'submit', { newStatus, tenancyRisk });

    // Notify appropriate approver
    if (newStatus === 'pending_manager') {
      const managers = await User.findAll({ where: { role: 'manager' } });
      for (const mgr of managers) {
        await notify(mgr.id, assessment.id, 'submission',
          `Assessment for ${assessment.applicantName} requires your approval (Medium risk)`);
      }
    } else if (newStatus === 'pending_senior') {
      const seniors = await User.findAll({ where: { role: 'senior_manager' } });
      for (const sr of seniors) {
        await notify(sr.id, assessment.id, 'submission',
          `Assessment for ${assessment.applicantName} requires your approval (High risk)`);
      }
    }

    res.json(assessment);
  } catch (err) {
    console.error('Submit error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Approve assessment
router.post('/:id/approve', requireRole('manager', 'senior_manager'), async (req, res) => {
  try {
    const assessment = await Assessment.findByPk(req.params.id);
    if (!assessment) return res.status(404).json({ error: 'Assessment not found' });

    // Check role matches required approval level
    if (assessment.status === 'pending_senior' && req.user.role !== 'senior_manager') {
      return res.status(403).json({ error: 'Senior manager approval required' });
    }

    // Block approval if assessment was deferred and not resubmitted by assessor
    if (assessment.deferralReason && !assessment.resubmittedAt) {
      return res.status(400).json({ error: 'This assessment was deferred and must be resubmitted by the assessor before it can be approved' });
    }

    await assessment.update({
      status: 'approved',
      lockedAt: new Date(),
      lockedBy: req.user.id,
    });

    await audit(assessment.id, req.user.id, 'approve', { notes: req.body.notes });

    // Notify assessor
    await notify(assessment.assessorId, assessment.id, 'approval',
      `Your assessment for ${assessment.applicantName} has been approved by ${req.user.fullName}`);

    res.json(assessment);
  } catch (err) {
    console.error('Approve error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reject assessment
router.post('/:id/reject', requireRole('manager', 'senior_manager'), async (req, res) => {
  try {
    const assessment = await Assessment.findByPk(req.params.id);
    if (!assessment) return res.status(404).json({ error: 'Assessment not found' });

    await assessment.update({
      status: 'rejected',
      rejectionReason: req.body.notes || 'No reason provided',
      rejectedBy: req.user.id,
    });
    await audit(assessment.id, req.user.id, 'reject', { notes: req.body.notes });

    await notify(assessment.assessorId, assessment.id, 'rejection',
      `Your assessment for ${assessment.applicantName} has been rejected by ${req.user.fullName}. Reason: ${req.body.notes || 'No reason provided'}`);

    res.json(assessment);
  } catch (err) {
    console.error('Reject error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Defer assessment
router.post('/:id/defer', requireRole('manager', 'senior_manager'), async (req, res) => {
  try {
    const assessment = await Assessment.findByPk(req.params.id);
    if (!assessment) return res.status(404).json({ error: 'Assessment not found' });

    const { reason, timeframe, actions, followUpDate, notes } = req.body;
    if (!reason) {
      return res.status(400).json({ error: 'Deferral reason is required' });
    }

    await assessment.update({
      status: 'deferred',
      deferralReason: reason,
      deferralTimeframe: timeframe,
      deferralActions: actions,
      deferralFollowUpDate: followUpDate || null,
    });

    await audit(assessment.id, req.user.id, 'defer', { reason, timeframe, actions, followUpDate, notes });

    await notify(assessment.assessorId, assessment.id, 'deferral',
      `Your assessment for ${assessment.applicantName} has been deferred by ${req.user.fullName}. Reason: ${reason}`);

    res.json(assessment);
  } catch (err) {
    console.error('Defer error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Complete deferral follow-up
router.post('/:id/defer/complete', requireRole('manager', 'senior_manager'), async (req, res) => {
  try {
    const assessment = await Assessment.findByPk(req.params.id);
    if (!assessment) return res.status(404).json({ error: 'Assessment not found' });

    if (assessment.status !== 'deferred') {
      return res.status(400).json({ error: 'Assessment is not deferred' });
    }

    const tenancyRisk = assessment.formData.part8?.tenancyRisk || assessment.formData.part6?.tenancyRisk || assessment.overallMatchChallenge;
    const newStatus = tenancyRisk === 'High' ? 'pending_senior' : 'pending_manager';

    await assessment.update({ status: newStatus });
    await audit(assessment.id, req.user.id, 'defer_complete', { notes: req.body.notes });

    res.json(assessment);
  } catch (err) {
    console.error('Defer complete error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Amend assessment (creates a copy)
router.post('/:id/amend', requireRole('manager', 'senior_manager'), async (req, res) => {
  try {
    const original = await Assessment.findByPk(req.params.id);
    if (!original) return res.status(404).json({ error: 'Assessment not found' });

    if (original.status !== 'approved') {
      return res.status(400).json({ error: 'Can only amend approved assessments' });
    }

    const amendment = await Assessment.create({
      applicantName: original.applicantName,
      assessorId: original.assessorId,
      status: 'draft',
      currentPart: 1,
      formData: { ...original.formData },
      housingNeedRating: original.housingNeedRating,
      grossChallengeRating: original.grossChallengeRating,
      residualChallengeRating: original.residualChallengeRating,
      overallMatchChallenge: original.overallMatchChallenge,
      amendedFromId: original.id,
      lastSavedAt: new Date(),
      lastSavedPart: 1,
    });

    await audit(original.id, req.user.id, 'amend', { newAssessmentId: amendment.id });
    await audit(amendment.id, req.user.id, 'create', { amendedFrom: original.id });

    res.status(201).json(amendment);
  } catch (err) {
    console.error('Amend error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Professional judgment override
router.post('/:id/override', async (req, res) => {
  try {
    const assessment = await Assessment.findByPk(req.params.id);
    if (!assessment) return res.status(404).json({ error: 'Assessment not found' });

    if (assessment.lockedAt) {
      return res.status(403).json({ error: 'Assessment is locked' });
    }

    const { originalScore, adjustedScore, justification } = req.body;
    if (!justification) {
      return res.status(400).json({ error: 'Justification is required for override' });
    }

    const override = {
      originalScore,
      adjustedScore,
      justification,
      assessorName: req.user.fullName,
      date: new Date().toISOString(),
    };

    await assessment.update({ professionalJudgementOverride: override });
    await audit(assessment.id, req.user.id, 'override', override);

    res.json(assessment);
  } catch (err) {
    console.error('Override error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get audit trail
router.get('/:id/audit', async (req, res) => {
  try {
    const { action } = req.query;
    const where = { assessmentId: req.params.id };
    if (action) where.action = action;

    const logs = await AuditLog.findAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'fullName'] }],
      order: [['createdAt', 'DESC']],
    });

    res.json(logs);
  } catch (err) {
    console.error('Audit trail error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Export audit trail as CSV
router.get('/:id/audit/export', async (req, res) => {
  try {
    const logs = await AuditLog.findAll({
      where: { assessmentId: req.params.id },
      include: [{ model: User, as: 'user', attributes: ['id', 'fullName'] }],
      order: [['createdAt', 'ASC']],
    });

    const csv = [
      'Timestamp,User,Action,Details',
      ...logs.map(log =>
        `"${log.createdAt.toISOString()}","${log.user?.fullName || ''}","${log.action}","${JSON.stringify(log.details).replace(/"/g, '""')}"`
      ),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=audit-${req.params.id}.csv`);
    res.send(csv);
  } catch (err) {
    console.error('Audit export error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Soft delete - assessors can delete their own drafts, senior managers can delete any with reason
router.delete('/:id', async (req, res) => {
  try {
    const assessment = await Assessment.findByPk(req.params.id);
    if (!assessment) return res.status(404).json({ error: 'Assessment not found' });

    if (req.user.role === 'senior_manager') {
      const { reason } = req.body || {};
      if (!reason) {
        return res.status(400).json({ error: 'Deletion reason is required' });
      }
      await assessment.update({ deletedReason: reason, deletedBy: req.user.id });
      await assessment.destroy(); // paranoid soft delete
      await audit(assessment.id, req.user.id, 'delete', { reason });

      // Notify the assessor
      await notify(assessment.assessorId, assessment.id, 'rejection',
        `Assessment for ${assessment.applicantName} has been deleted by ${req.user.fullName}. Reason: ${reason}`);

      res.json({ message: 'Assessment deleted' });
    } else if (req.user.role === 'assessor') {
      if (assessment.assessorId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      if (assessment.status !== 'draft') {
        return res.status(400).json({ error: 'Can only delete draft assessments' });
      }
      await assessment.destroy(); // paranoid soft delete
      await audit(assessment.id, req.user.id, 'delete', {});
      res.json({ message: 'Assessment deleted' });
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Resubmit deferred assessment (assessor only)
router.post('/:id/resubmit', requireRole('assessor'), async (req, res) => {
  try {
    const assessment = await Assessment.findByPk(req.params.id);
    if (!assessment) return res.status(404).json({ error: 'Assessment not found' });

    if (assessment.assessorId !== req.user.id) {
      return res.status(403).json({ error: 'Only the assessor can resubmit' });
    }

    if (assessment.status !== 'deferred') {
      return res.status(400).json({ error: 'Can only resubmit deferred assessments' });
    }

    const { notes } = req.body;
    if (!notes) {
      return res.status(400).json({ error: 'Resubmission notes are required (describe what was updated)' });
    }

    // Determine approval pathway
    const tenancyRisk = assessment.formData.part8?.tenancyRisk || assessment.overallMatchChallenge;
    const newStatus = tenancyRisk === 'High' ? 'pending_senior' : 'pending_manager';

    await assessment.update({
      status: newStatus,
      resubmittedAt: new Date(),
      resubmissionNotes: notes,
    });

    await audit(assessment.id, req.user.id, 'resubmit', { notes });

    // Notify appropriate approvers
    if (newStatus === 'pending_manager') {
      const managers = await User.findAll({ where: { role: 'manager' } });
      for (const mgr of managers) {
        await notify(mgr.id, assessment.id, 'submission',
          `Assessment for ${assessment.applicantName} has been resubmitted by ${req.user.fullName} after deferral. Notes: ${notes}`);
      }
    } else {
      const seniors = await User.findAll({ where: { role: 'senior_manager' } });
      for (const sr of seniors) {
        await notify(sr.id, assessment.id, 'submission',
          `Assessment for ${assessment.applicantName} has been resubmitted by ${req.user.fullName} after deferral. Notes: ${notes}`);
      }
    }

    res.json(assessment);
  } catch (err) {
    console.error('Resubmit error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Check follow-up reminders (called periodically)
router.get('/reminders/check', async (req, res) => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const deferred = await Assessment.findAll({
      where: {
        status: 'deferred',
        deferralFollowUpDate: tomorrowStr,
        deletedAt: null,
      },
    });

    for (const a of deferred) {
      // Notify assessor
      await notify(a.assessorId, a.id, 'followup',
        `Reminder: Follow-up for ${a.applicantName} is due tomorrow (${a.deferralFollowUpDate}). Reason: ${a.deferralReason || 'Not specified'}`);

      // Notify managers
      const managers = await User.findAll({ where: { role: ['manager', 'senior_manager'] } });
      for (const mgr of managers) {
        await notify(mgr.id, a.id, 'followup',
          `Reminder: Follow-up for ${a.applicantName} is due tomorrow (${a.deferralFollowUpDate}).`);
      }
    }

    res.json({ checked: deferred.length });
  } catch (err) {
    console.error('Reminder check error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
