'use client';

import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-bot-bg text-bot-text">
      {/* Header */}
      <div className="bg-bot-panel border-b border-bot-text/10">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold">Privacy Policy</h1>
            <Link
              href="/"
              className="text-bot-muted hover:text-bot-text transition-colors"
            >
              ← Home
            </Link>
          </div>
          <p className="text-bot-muted mt-2">Last updated: March 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="space-y-8">
          {/* Introduction */}
          <section>
            <p className="text-bot-text leading-relaxed">
              Your privacy is important to us. This Privacy Policy explains how 2BOTS (2bots.io) collects, uses, discloses, and safeguards your information when you use our web application. Please read this policy carefully. If you do not agree with our data practices, you should not use our service.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-2xl font-semibold text-bot-text mb-4">1. Information We Collect</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-bot-text mb-2">Conversation Content</h3>
                <p className="text-bot-text leading-relaxed">
                  When you use 2BOTS, we transmit your conversation inputs and AI-generated outputs to Anthropic (for Claude) and OpenAI (for ChatGPT) API services. These conversations are necessary to provide the core functionality of our service—allowing you to interact with multiple AI models simultaneously.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-bot-text mb-2">Voice Recordings & Transcriptions</h3>
                <p className="text-bot-text leading-relaxed">
                  If you use the voice input feature, 2BOTS captures and temporarily processes your voice recordings. Voice audio is sent to OpenAI's Whisper API for transcription into text. These voice recordings are <span className="font-semibold">not stored permanently</span> by 2BOTS—they are deleted after transcription is complete. Please note that OpenAI may retain transcription data according to their privacy policy. We recommend reviewing OpenAI's terms for details on how they handle voice data.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-bot-text mb-2">Account & Authentication Information</h3>
                <p className="text-bot-text leading-relaxed">
                  When you sign up for 2BOTS, we collect your email address and authentication credentials through Clerk (our authentication provider). Clerk securely manages user authentication, and we do not store your passwords directly. Only your email address and user ID are retained in our system.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-bot-text mb-2">Usage Data & Session Information</h3>
                <p className="text-bot-text leading-relaxed">
                  We track the following for service improvement and usage management:
                </p>
                <ul className="space-y-2 text-bot-text list-disc list-inside mt-2 ml-2">
                  <li>Number of conversations created (to enforce the 3-per-day free tier limit)</li>
                  <li>Session duration and frequency</li>
                  <li>Feature usage (voice input vs. text input)</li>
                  <li>Subscription tier and status</li>
                </ul>
                <p className="text-bot-text leading-relaxed mt-2">
                  This data may be stored locally in your browser (via localStorage/cookies) and/or in our Supabase database for authenticated users.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-bot-text mb-2">Payment Information</h3>
                <p className="text-bot-text leading-relaxed">
                  For Pro tier subscribers, payment information is collected and processed through Stripe, our payment processor. 2BOTS does not directly store your credit card numbers or detailed payment data. Stripe handles all payment processing securely and in compliance with PCI DSS standards. We only retain transaction IDs, billing amounts, and subscription status in our database.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-bot-text mb-2">Cookies & Browser Storage</h3>
                <p className="text-bot-text leading-relaxed">
                  2BOTS uses cookies and browser storage (localStorage, sessionStorage) to:
                </p>
                <ul className="space-y-2 text-bot-text list-disc list-inside mt-2 ml-2">
                  <li>Maintain your authentication session</li>
                  <li>Track conversation count for the free tier limit</li>
                  <li>Store user preferences and settings</li>
                  <li>Enable analytics for service improvement</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-bot-text mb-2">Device & Technical Information</h3>
                <p className="text-bot-text leading-relaxed">
                  We may automatically collect information about your device, including browser type, operating system, IP address, and pages visited. This helps us diagnose technical issues, prevent abuse, and understand how users interact with our service.
                </p>
              </div>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-2xl font-semibold text-bot-text mb-4">2. How We Use Your Information</h2>
            <p className="text-bot-text leading-relaxed mb-4">
              We use the information we collect for the following purposes:
            </p>
            <ul className="space-y-2 text-bot-text list-disc list-inside">
              <li>To provide and maintain the 2BOTS service</li>
              <li>To process payments and manage subscriptions</li>
              <li>To enforce usage limits (free tier conversation limits)</li>
              <li>To improve, personalize, and optimize our service</li>
              <li>To send transactional emails (account notifications, billing updates)</li>
              <li>To prevent fraud, abuse, and security violations</li>
              <li>To comply with legal obligations</li>
              <li>To respond to your support requests</li>
            </ul>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="text-2xl font-semibold text-bot-text mb-4">3. Third-Party Service Providers</h2>
            <p className="text-bot-text leading-relaxed mb-4">
              2BOTS relies on several third-party services to operate. Your data may be shared with:
            </p>
            <div className="bg-bot-panel rounded-lg p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-bot-text mb-1">Anthropic (Claude API)</h3>
                <p className="text-bot-muted text-sm">
                  Receives conversation inputs and generates responses. Subject to Anthropic's privacy policy and terms.
                </p>
              </div>
              <div className="border-t border-bot-text/10 pt-4">
                <h3 className="font-semibold text-bot-text mb-1">OpenAI (ChatGPT & Whisper APIs)</h3>
                <p className="text-bot-muted text-sm">
                  Receives conversation inputs, generates responses, and processes voice transcriptions. Subject to OpenAI's privacy policy and terms.
                </p>
              </div>
              <div className="border-t border-bot-text/10 pt-4">
                <h3 className="font-semibold text-bot-text mb-1">Stripe (Payment Processing)</h3>
                <p className="text-bot-muted text-sm">
                  Handles Pro tier subscription billing and payment data. Subject to Stripe's privacy policy and PCI DSS compliance standards.
                </p>
              </div>
              <div className="border-t border-bot-text/10 pt-4">
                <h3 className="font-semibold text-bot-text mb-1">Clerk (Authentication)</h3>
                <p className="text-bot-muted text-sm">
                  Manages user authentication and identity verification. Your email and authentication data are processed by Clerk. Subject to Clerk's privacy policy.
                </p>
              </div>
              <div className="border-t border-bot-text/10 pt-4">
                <h3 className="font-semibold text-bot-text mb-1">Supabase (Database & Storage)</h3>
                <p className="text-bot-muted text-sm">
                  Stores session data, usage information, and subscription details. Subject to Supabase's privacy policy and terms.
                </p>
              </div>
            </div>
            <p className="text-bot-text leading-relaxed mt-4">
              We recommend reviewing the privacy policies of these third-party providers to understand how they handle your data. By using 2BOTS, you acknowledge that your data will be processed by these services.
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-semibold text-bot-text mb-4">4. Data Retention</h2>
            <p className="text-bot-text leading-relaxed mb-4">
              Our data retention practices are as follows:
            </p>
            <div className="bg-bot-panel rounded-lg p-6 space-y-3">
              <div>
                <p className="text-bot-text font-semibold">Conversation Content:</p>
                <p className="text-bot-muted text-sm">
                  Conversations are transmitted to Anthropic and OpenAI for processing. 2BOTS may retain conversation summaries or metadata for service improvement, but we do not permanently store complete conversation transcripts. Users can request deletion of their conversation data.
                </p>
              </div>
              <div className="border-t border-bot-text/10 pt-3">
                <p className="text-bot-text font-semibold">Voice Recordings:</p>
                <p className="text-bot-muted text-sm">
                  Voice audio is deleted from 2BOTS systems immediately after transcription. The resulting text transcript follows the retention policy of conversation content.
                </p>
              </div>
              <div className="border-t border-bot-text/10 pt-3">
                <p className="text-bot-text font-semibold">Usage Data:</p>
                <p className="text-bot-muted text-sm">
                  Session and usage logs are retained for 90 days for analytics and abuse detection. After 90 days, data is aggregated or deleted.
                </p>
              </div>
              <div className="border-t border-bot-text/10 pt-3">
                <p className="text-bot-text font-semibold">Account Information:</p>
                <p className="text-bot-muted text-sm">
                  Email and account data are retained for as long as your account is active. Upon account deletion, personal information is removed from our systems within 30 days, except where required by law.
                </p>
              </div>
              <div className="border-t border-bot-text/10 pt-3">
                <p className="text-bot-text font-semibold">Payment Records:</p>
                <p className="text-bot-muted text-sm">
                  Transaction and subscription records are retained for 7 years to comply with tax and financial regulations.
                </p>
              </div>
            </div>
          </section>

          {/* User Rights & Data Control */}
          <section>
            <h2 className="text-2xl font-semibold text-bot-text mb-4">5. Your Rights & Data Control</h2>
            <p className="text-bot-text leading-relaxed mb-4">
              You have the following rights regarding your personal data:
            </p>
            <ul className="space-y-3 text-bot-text list-disc list-inside">
              <li><span className="font-semibold">Right to Access:</span> You can request a copy of the personal data we hold about you.</li>
              <li><span className="font-semibold">Right to Correction:</span> You can request that we update or correct inaccurate information in your account.</li>
              <li><span className="font-semibold">Right to Deletion:</span> You can request deletion of your account and associated data, subject to legal retention requirements.</li>
              <li><span className="font-semibold">Right to Data Portability:</span> You can request your data in a machine-readable format.</li>
              <li><span className="font-semibold">Right to Opt-Out:</span> You can opt out of non-essential data collection and marketing communications.</li>
            </ul>
            <p className="text-bot-text leading-relaxed mt-4">
              To exercise any of these rights, please contact us at support@2bots.io with your request and account details. We will respond to your request within 30 days.
            </p>
          </section>

          {/* Security */}
          <section>
            <h2 className="text-2xl font-semibold text-bot-text mb-4">6. Security</h2>
            <p className="text-bot-text leading-relaxed mb-4">
              We implement industry-standard security measures to protect your data, including:
            </p>
            <ul className="space-y-2 text-bot-text list-disc list-inside">
              <li>HTTPS encryption for all communications</li>
              <li>Secure authentication through Clerk</li>
              <li>Encrypted storage in Supabase</li>
              <li>PCI DSS compliance for payment processing via Stripe</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Access controls limiting employee access to personal data</li>
            </ul>
            <p className="text-bot-text leading-relaxed mt-4">
              While we strive to protect your data, no system is completely secure. We encourage you to use strong passwords, enable two-factor authentication (if available), and report any security concerns to support@2bots.io.
            </p>
          </section>

          {/* GDPR & CCPA */}
          <section>
            <h2 className="text-2xl font-semibold text-bot-text mb-4">7. GDPR & CCPA Compliance</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-bot-text mb-2">GDPR (European Users)</h3>
                <p className="text-bot-text leading-relaxed">
                  If you are in the EU or UK, the General Data Protection Regulation (GDPR) applies to your data. 2BOTS processes your data based on the legal basis of contract performance (to provide our service) and legitimate interest (to improve and secure our service). You have enhanced rights under GDPR, including the right to lodge a complaint with your local data protection authority.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-bot-text mb-2">CCPA (California Residents)</h3>
                <p className="text-bot-text leading-relaxed">
                  If you are a California resident, the California Consumer Privacy Act (CCPA) grants you specific rights. You can:
                </p>
                <ul className="space-y-2 text-bot-text list-disc list-inside mt-2 ml-2">
                  <li>Request disclosure of what personal information we collect and how it is used</li>
                  <li>Request deletion of your personal information</li>
                  <li>Opt-out of the sale or sharing of your personal information (we do not sell your data)</li>
                  <li>Request non-discrimination for exercising your CCPA rights</li>
                </ul>
                <p className="text-bot-text leading-relaxed mt-2">
                  To exercise CCPA rights, contact support@2bots.io with verification of your identity.
                </p>
              </div>
            </div>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-semibold text-bot-text mb-4">8. Children's Privacy</h2>
            <p className="text-bot-text leading-relaxed">
              2BOTS is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If we discover that a child under 13 has created an account or provided personal information, we will delete that information and terminate the account immediately. If you believe a child under 13 has used 2BOTS, please contact us at support@2bots.io.
            </p>
          </section>

          {/* Cookies & Tracking */}
          <section>
            <h2 className="text-2xl font-semibold text-bot-text mb-4">9. Cookies & Tracking Technologies</h2>
            <p className="text-bot-text leading-relaxed mb-4">
              2BOTS uses cookies and similar tracking technologies for:
            </p>
            <ul className="space-y-2 text-bot-text list-disc list-inside">
              <li><span className="font-semibold">Essential Cookies:</span> Required for authentication and session management</li>
              <li><span className="font-semibold">Analytics Cookies:</span> Track user behavior to improve the service</li>
              <li><span className="font-semibold">Preference Cookies:</span> Remember your settings and preferences</li>
            </ul>
            <p className="text-bot-text leading-relaxed mt-4">
              You can control cookies through your browser settings. Disabling essential cookies may impair functionality, while analytics and preference cookies can typically be disabled without affecting core service performance.
            </p>
          </section>

          {/* Data Sharing & Transfers */}
          <section>
            <h2 className="text-2xl font-semibold text-bot-text mb-4">10. International Data Transfers</h2>
            <p className="text-bot-text leading-relaxed">
              2BOTS operates globally, and your data may be transferred to, stored in, and processed in countries outside your country of residence, including the United States. These countries may have different data protection laws than your home country. By using 2BOTS, you consent to the transfer of your data to countries outside your country of residence, including the United States, subject to appropriate safeguards such as Standard Contractual Clauses.
            </p>
          </section>

          {/* Changes to Privacy Policy */}
          <section>
            <h2 className="text-2xl font-semibold text-bot-text mb-4">11. Changes to This Privacy Policy</h2>
            <p className="text-bot-text leading-relaxed">
              We may update this Privacy Policy periodically to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of material changes by updating the "Last updated" date on this page and, for significant changes, by sending you an email notification. Your continued use of 2BOTS after changes are posted constitutes your acceptance of the updated Privacy Policy.
            </p>
          </section>

          {/* Contact Us */}
          <section>
            <h2 className="text-2xl font-semibold text-bot-text mb-4">12. Contact Us</h2>
            <p className="text-bot-text leading-relaxed mb-4">
              If you have questions about this Privacy Policy, concerns about your data, or wish to exercise your rights, please contact us:
            </p>
            <div className="bg-bot-panel rounded-lg p-6 space-y-2">
              <p className="text-bot-text">
                <span className="font-semibold">Email:</span> support@2bots.io
              </p>
              <p className="text-bot-text">
                <span className="font-semibold">Website:</span> 2bots.io
              </p>
              <p className="text-bot-text">
                <span className="font-semibold">Response Time:</span> We aim to respond to privacy requests within 30 days.
              </p>
            </div>
          </section>

          {/* Footer */}
          <section className="border-t border-bot-text/10 pt-8 mt-12">
            <p className="text-bot-muted text-sm">
              By using 2BOTS, you acknowledge that you have read and understood this Privacy Policy. If you do not agree with any part of this policy, please refrain from using our service. Your privacy is important to us, and we are committed to being transparent about how we collect, use, and protect your data.
            </p>
          </section>
        </div>
      </div>

      {/* Bottom spacing */}
      <div className="h-16" />
    </div>
  );
}
