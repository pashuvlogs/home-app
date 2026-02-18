const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Assessment = sequelize.define('Assessment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    applicantName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    assessorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'draft',
    },
    currentPart: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    formData: {
      type: DataTypes.JSON,
      defaultValue: {
        part1: {}, part2: {}, part3: {},
        part4: {}, part5: {}, part6: {},
      },
    },
    housingNeedRating: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    grossChallengeRating: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    residualChallengeRating: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    overallMatchChallenge: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    finalRecommendation: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    professionalJudgementOverride: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    deferralReason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    deferralTimeframe: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    deferralActions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    deferralFollowUpDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    lockedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lockedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    amendedFromId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    lastSavedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastSavedPart: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deletedReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    deletedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rejectedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    resubmittedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    resubmissionNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'assessments',
    timestamps: true,
    paranoid: true,
  });

  return Assessment;
};
