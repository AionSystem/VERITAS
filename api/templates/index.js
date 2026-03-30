const fs = require('fs');
const path = require('path');

const TEMPLATES = {};

// Load all template JSON files
const templateFiles = [
  '01-ai-failure.json',
  '02-research-priority.json',
  '03-evidence-chain.json',
  '04-creative-priority.json',
  '06-scope-anchor.json',
  '07-general-trace.json'
  // Add remaining templates: 05, 08, 09, 10, 11, 12, 13, 14
];

for (const file of templateFiles) {
  try {
    const template = require(`./${file}`);
    TEMPLATES[template.id] = template;
    console.log(`Loaded template: ${template.id} - ${template.name}`);
  } catch (err) {
    console.error(`Failed to load ${file}:`, err.message);
  }
}

function getTemplate(id) {
  return TEMPLATES[id] || TEMPLATES['07']; // Default to GENERAL-TRACE
}

function detectTemplate(entry, contextType = null) {
  if (contextType && TEMPLATES[contextType]) {
    return TEMPLATES[contextType];
  }
  
  const lowerEntry = (entry || '').toLowerCase();
  
  // Priority order (most severe first)
  const priority = ['13', '05', '10', '11', '12', '01', '09', '06', '03', '08', '02', '04'];
  
  for (const id of priority) {
    const template = TEMPLATES[id];
    if (template && template.triggers && template.triggers.some(t => lowerEntry.includes(t.toLowerCase()))) {
      return template;
    }
  }
  
  return TEMPLATES['07'];
}

function validateTemplateRequirements(template, body) {
  const missing = [];
  
  if (template.requires_docusign && !body.docusign_completed) {
    missing.push('DocuSign verification required');
  }
  if (template.requires_identity && !body.identity_verified) {
    missing.push('Identity verification required');
  }
  if (template.requires_phi_gate && !body.phi_gate_confirmed) {
    missing.push('PHI gate confirmation required');
  }
  if (template.requires_stripe && !body.stripe_payment_id) {
    missing.push('Stripe payment ID required');
  }
  if (template.requires_prior_seal && !body.prior_seal_hash) {
    missing.push('Prior seal hash required (Webeater Link)');
  }
  if (template.requires_auditor_badge && !body.auditor_badge) {
    missing.push('Auditor badge required');
  }
  
  // Check required fields
  for (const field of template.fields) {
    if (field.required && !body[field.id]) {
      missing.push(`Field "${field.label}" is required`);
    }
  }
  
  return {
    valid: missing.length === 0,
    missing
  };
}

function renderIssueBody(template, formData) {
  let body = '';
  
  // Add legal notice
  if (template.legal_notice) {
    body += `## ${template.legal_notice.title}\n\n`;
    body += template.legal_notice.content.join('\n') + '\n\n---\n\n';
  }
  
  // Add fields
  for (const field of template.fields) {
    const value = formData[field.id];
    if (value) {
      if (field.type === 'checkboxes') {
        body += `### ${field.label}\n`;
        const checkedValues = Array.isArray(value) ? value : [value];
        for (const option of field.options) {
          if (checkedValues.includes(option) || (typeof value === 'string' && value.includes(option))) {
            body += `- ✅ ${option}\n`;
          }
        }
        body += '\n';
      } else if (field.type === 'upload') {
        body += `### ${field.label}\n`;
        body += `[Evidence files attached - see GitHub assets]\n\n`;
      } else {
        body += `### ${field.label}\n`;
        body += `${value}\n\n`;
      }
    }
  }
  
  // Add after-submit steps
  if (template.after_submit) {
    body += `---\n\n## What Happens Next\n\n`;
    for (const step of template.after_submit.steps) {
      body += `${step}\n`;
    }
    body += `\n---\n\n${template.after_submit.footer}`;
  }
  
  return body;
}

module.exports = {
  TEMPLATES,
  getTemplate,
  detectTemplate,
  validateTemplateRequirements,
  renderIssueBody
};