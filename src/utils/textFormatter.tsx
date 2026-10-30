import React from 'react';

/**
 * Text formatter to apply italic styling (font-style: italic) to English and Latin terms
 * in accordance with Indonesian orthography (EYD / PUEBI).
 */

const FOREIGN_PATTERNS = [
  // 26 Specific Units (ordered longest first to prevent partial matching)
  'Customer Relation & Marketing',
  'Finance & Accounting',
  'Information Technology',
  'Asset & Procurement',
  'Nursing Units Head',
  'Operating Theater',
  'Nursing Preceptor',
  'Intensive Care',
  'Medical Record',
  'Medical Rehab',
  'Delivery Room',
  'Human Capital',
  'Data Analyst',
  'Outpatient',
  'Inpatient',
  'Emergency',
  'Radiology',
  'Pharmacy',
  'Laboratory',
  'Nutrition',
  'Inventory',
  'Cashier',
  'CSSD',
  'FMGA',
  'DRIVER',
  'Outsourcing',

  // Multi-word English & Latin terms (ordered longest first)
  'Nursing Preseptor Academy',
  'Nursing Preceptor Academy',
  'Calender Training',
  'Human Capital Academy',
  'Information Security Management',
  'Strategic Decision Making',
  'Clinical Preceptorship',
  'Clinical Preceptor',
  'Preceptorship in Critical Care',
  'Coaching & Mentoring',
  'Training of Trainers',
  'Patient Safety & Risk Management',
  'Patient Safety',
  'Root Cause Analysis',
  'Evidence-Based Nursing Practice',
  'Evidence-Based Nursing',
  'Evidence-Based',
  'Bedside Teaching',
  'Standard Operating Procedure',
  'Basic Trauma Cardiac Life Support',
  'Zoom Meeting Room',
  'Zoom Meeting',
  'Corporate Training Hall',
  'Principal Security Architect',
  'Lead ISO 27001 Assessor',
  'Lead ISO Assessor',
  'DevOps & Infrastructure Officer',
  'Senior Network & Security Engineer',
  'Database Administrator Specialist',
  'Senior Software Engineer',
  'Talent Development Officer',
  'Cybersecurity Defense Institute',
  'Cyber Lab',
  'Legal Counsel',
  'Pre-Test',
  'Post-Test',
  'Pre-test',
  'Post-test',
  'Curriculum Vitae',
  'Vice Versa',
  'Status Quo',
  'De Facto',
  'De Jure',
  'Ad Hoc',
  'Per Se',
  'Et Al',
  'Et Cetera',

  // Single-word English & Latin terms
  'Coorporate',
  'Corporate',
  'Preseptor',
  'Preceptor',
  'Preceptorship',
  'Excel',
  'Spreadsheet',
  'Download',
  'Upload',
  'Export',
  'Import',
  'Template',
  'Online',
  'Offline',
  'Hybrid',
  'Delta',
  'Score',
  'Live',
  'Drawer',
  'Cockpit',
  'File',
  'Workshop',
  'Webinar',
  'Mentoring',
  'Coaching',
  'Auditorium',
  'Curriculum',
  'Agenda',
  'Detail',
  'Overview',
  'Breakdown',
  'Assessment',
  'Review',
  'Feedback',
  'Append',
  'Replace',
  'Cyber'
];

// Regex matching whole words for these terms
const FOREIGN_REGEX = new RegExp(
  `\\b(${FOREIGN_PATTERNS.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
  'gi'
);

/**
 * Parses a string and wraps any English/Latin matches in <span className="italic">
 */
export function formatForeignText(text: string): React.ReactNode {
  if (!text) return text;

  const parts = text.split(FOREIGN_REGEX);
  if (parts.length === 1) return text;

  return (
    <>
      {parts.map((part, index) => {
        // Test if this segment is a foreign term
        if (FOREIGN_REGEX.test(part)) {
          FOREIGN_REGEX.lastIndex = 0; // reset regex index
          return (
            <span key={index} className="italic">
              {part}
            </span>
          );
        }
        FOREIGN_REGEX.lastIndex = 0;
        return part;
      })}
    </>
  );
}

/**
 * Component wrapper for easily rendering text with foreign terms in italic
 */
export const ForeignText: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  return <span className={className}>{formatForeignText(text)}</span>;
};
