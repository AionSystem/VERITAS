import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const TEMPLATES = {};

// Load all template JSON files
const templateFiles = [
  '01-ai-failure.json',
  '02-research-priority.json',
  '03-evidence-chain.json',
  '04-creative-priority.json',
  '05-clinical-record.json',
  '06-scope-anchor.json',
  '07-general-trace.json',
  '08-foresight-seal.json',
  '09-webeater-link.json',
  '10-audit-request.json',
  '11-audit-completion.json',
  '12-auditor-application.json',
  '13-integrity-violation.json',
  '14-near-miss.json',
  '15-veritas-report.json',
  '16-veritas-export.json'
];

for (const file of templateFiles) {
  try {
    const templatePath = path.join(__dirname, file);
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    const template = JSON.parse(templateContent);
    TEMPLATES[template.id] = template;
    console.log(`Loaded template: ${template.id} - ${template.name}`);
  } catch (err) {
    console.error(`Failed to load ${file}:`, err.message);
  }
}

export function getTemplate(id) {
  return TEMPLATES[id] || TEMPLATES['07'];
}

export function detectTemplate(entry, contextType = null) {
  if (contextType && TEMPLATES[contextType]) {
    return TEMPLATES[contextType];
  }
  
  const lowerEntry = (entry || '').toLowerCase();
  
  // Check for VERITAS Report (Template 15)
  if (lowerEntry.includes('damage report') || 
      lowerEntry.includes('building damage') || 
      lowerEntry.includes('infrastructure damage') ||
      lowerEntry.includes('veritas report') ||
      lowerEntry.includes('damage assessment') ||
      (lowerEntry.includes('report') && lowerEntry.includes('damage'))) {
    return TEMPLATES['15'];
  }
  
  // Check for VERITAS Export (Template 16)
  if (lowerEntry.includes('export') || 
      lowerEntry.includes('dataset') || 
      lowerEntry.includes('veritas export') ||
      lowerEntry.includes('data export') ||
      lowerEntry.includes('veritas integrity export')) {
    return TEMPLATES['16'];
  }
  
  // Priority order (most severe first)
  const priority = ['13', '05', '10', '11', '12', '01', '09', '06', '03', '08', '02', '04', '14'];
  
  for (const id of priority) {
    const template = TEMPLATES[id];
    if (template && template.triggers && template.triggers.some(t => lowerEntry.includes(t.toLowerCase()))) {
      return template;
    }
  }
  
  return TEMPLATES['07'];
}

export function validateTemplateRequirements(template, body) {
  const missing = [];
  
  // Handle both formats: body directly or body.fields
  const data = body?.fields || body || {};
  
  // Check special requirements
  if (template.requires_docusign && !data.docusign_completed) {
    missing.push('DocuSign verification required');
  }
  if (template.requires_identity && !data.identity_verified) {
    missing.push('Identity verification required');
  }
  if (template.requires_phi_gate && !data.phi_gate_confirmed) {
    missing.push('PHI gate confirmation required');
  }
  if (template.requires_stripe && !data.stripe_payment_id) {
    missing.push('Stripe payment ID required');
  }
  if (template.requires_prior_seal && !data.prior_seal_hash) {
    missing.push('Prior seal hash required (Webeater Link)');
  }
  if (template.requires_auditor_badge && !data.auditor_badge) {
    missing.push('Auditor badge required');
  }
  
  // Check required fields from template
  if (template.fields) {
    for (const field of template.fields) {
      if (field.required) {
        const value = data[field.id] || data.fields?.[field.id];
        if (!value || (Array.isArray(value) && value.length === 0)) {
          missing.push(`Field "${field.label}" is required`);
        }
      }
    }
  }
  
  // Special check for Template 01 (AI Failure) - DocuSign must be completed
  if (template.id === '01' && !data.docusign_completed && !data.fields?.docusign_completed) {
    missing.push('DocuSign verification must be completed before sealing');
  }
  
  // Special check for Template 05 (Clinical Record) - PHI gate confirmation required
  if (template.id === '05' && !data.phi_gate_confirmed && !data.fields?.phi_gate_confirmed) {
    missing.push('PHI gate confirmation required for clinical records');
  }
  
  // Special check for Template 13 (Integrity Violation) - requires identity verification
  if (template.id === '13' && !data.identity_verified && !data.fields?.identity_verified) {
    missing.push('Identity verification required for integrity violation reports');
  }
  
  return {
    valid: missing.length === 0,
    missing
  };
}

export function renderIssueBody(template, formData, stamp, entry) {
  let body = '';
  
  // Add template header
  body += `# ${template.name}\n`;
  body += `**Template ID:** ${template.id}\n`;
  if (template.category) {
    body += `**Category:** ${template.category}\n`;
  }
  body += `\n---\n\n`;
  
  // Add legal notice
  if (template.legal_notice) {
    body += `## ${template.legal_notice.title}\n\n`;
    body += template.legal_notice.content.join('\n') + '\n\n---\n\n';
  }
  
  // Add triple-time stamp
  if (stamp) {
    body += `## 📅 Triple-Time Stamp\n\n`;
    body += `| Calendar | Value |\n`;
    body += `|----------|-------|\n`;
    body += `| Gregorian | ${stamp.gregorian} |\n`;
    body += `| Hebrew | ${stamp.hebrew} |\n`;
    body += `| Dreamspell | ${stamp.dreamspell} |\n`;
    body += `| Unix UTC | ${stamp.unixUtc} |\n\n`;
    
    body += `## 🔒 STP Seal\n\n`;
    body += `**Seal:** \`${stamp.seal}\`\n`;
    body += `**Ledger File:** \`${stamp.ledgerFile}\`\n\n`;
  }
  
  // Add original entry
  if (entry) {
    body += `## 📝 Original Entry\n\n`;
    body += `\`\`\`\n${entry}\n\`\`\`\n\n`;
  }
  
  // Add fields from template
  const data = formData?.fields || formData || {};
  
  if (template.fields && template.fields.length > 0) {
    body += `## 📋 Submission Data\n\n`;
    
    for (const field of template.fields) {
      const value = data[field.id] || data.fields?.[field.id];
      
      if (value !== undefined && value !== null && value !== '') {
        body += `### ${field.label}\n`;
        
        if (field.type === 'checkboxes') {
          // Handle checkboxes - value can be array, string, or object
          let checkedValues = [];
          if (Array.isArray(value)) {
            checkedValues = value;
          } else if (typeof value === 'string') {
            checkedValues = value.split(',').map(v => v.trim());
          } else if (typeof value === 'object') {
            checkedValues = Object.values(value).filter(v => v === true || v === 'true' || v === 'on');
          }
          
          for (const option of field.options) {
            if (checkedValues.some(v => v === option || (typeof v === 'string' && v.includes(option)))) {
              body += `- ✅ ${option}\n`;
            } else {
              body += `- ⬜ ${option}\n`;
            }
          }
        } 
        else if (field.type === 'upload') {
          body += `📎 [Evidence files attached - see GitHub assets]\n`;
        }
        else if (field.type === 'textarea') {
          body += `\`\`\`\n${value}\n\`\`\`\n`;
        }
        else if (field.type === 'dropdown') {
          body += `**Selected:** ${value}\n`;
        }
        else if (field.type === 'input') {
          body += `${value}\n`;
        }
        else {
          body += `${value}\n`;
        }
        
        body += `\n`;
      }
    }
  }
  
  // Add after-submit steps
  if (template.after_submit) {
    body += `---\n\n## What Happens Next\n\n`;
    for (const step of template.after_submit.steps) {
      body += `- ${step}\n`;
    }
    body += `\n---\n\n${template.after_submit.footer}`;
  }
  
  // Add server metadata
  body += `\n\n---\n\n## ⚙️ Metadata\n\n`;
  body += `- **Sealed by:** VERITAS STP Service\n`;
  body += `- **Protocol:** Sovereign Trace Protocol\n`;
  body += `- **Sealed at:** ${new Date().toISOString()}\n`;
  
  return body;
}