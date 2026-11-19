const db = require('./db');

/**
 * Replaces {var_name} in a template string with values from variablesObj
 */
function renderTemplateString(bodyTemplate = '', variablesObj = {}) {
  let rendered = String(bodyTemplate || '');
  for (const [rawKey, val] of Object.entries(variablesObj)) {
    const cleanKey = rawKey.replace(/^[{\s]+|[}\s]+$/g, '');
    const regex = new RegExp(`\\{${cleanKey}\\}`, 'g');
    rendered = rendered.replace(regex, val !== undefined && val !== null ? String(val) : '');
  }
  return rendered.trim();
}

/**
 * Fetches a template by key from database and renders it with variables
 */
async function getAndRenderTemplate(templateKey, variablesObj = {}) {
  const res = await db.query('SELECT * FROM whatsapp_templates WHERE key = $1', [templateKey]);
  const tpl = res.rows[0];
  if (!tpl) {
    throw new Error(`القالب (${templateKey}) غير موجود في قاعدة البيانات`);
  }

  const settingsRes = await db.query('SELECT center_support_phone FROM whatsapp_settings WHERE id = 1');
  const supportPhone = settingsRes.rows[0]?.center_support_phone || '01288817183';

  const mergedVars = {
    center_phone: supportPhone,
    ...variablesObj,
  };

  const renderedText = renderTemplateString(tpl.body_template, mergedVars);

  return {
    template: tpl,
    isApproved: Boolean(tpl.is_approved),
    isEnabled: Boolean(tpl.is_enabled),
    text: renderedText,
  };
}

module.exports = {
  renderTemplateString,
  getAndRenderTemplate,
};

