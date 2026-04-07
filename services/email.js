'use strict';

const nodemailer = require('nodemailer');

let _transporter = null;

/**
 * Returns a shared nodemailer transporter, created lazily on first use.
 * Returns null if SMTP credentials are not configured.
 */
function getTransporter() {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
    if (!_transporter) {
        _transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587', 10),
            secure: process.env.SMTP_PORT === '465',
            pool: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    return _transporter;
}

/**
 * Send an email. Returns true on success, false if SMTP not configured.
 * @param {{ from?: string, to: string, subject: string, html: string, text?: string }} opts
 */
async function sendMail(opts) {
    const transporter = getTransporter();
    if (!transporter) return false;
    const from = opts.from || `"SmokeShopGrowth" <${process.env.SMTP_USER}>`;
    await transporter.sendMail({ from, ...opts });
    return true;
}

module.exports = { getTransporter, sendMail };
