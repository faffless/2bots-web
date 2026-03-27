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
              Your privacy is important to us. This Privacy Policy explains how 2BOTS (2bots.ai) collects, uses, and safeguards your information when you use our web application. If you do not agree with our data practices, you should not use our service.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-2xl font-semibold text-bot-text mb-4">1. Information We Collect</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-bot-text mb-2">Conversation Content</h3>
                <p className="text-bot-text leading-relaxed">
                  When you use 2BOTS, your conversation inputs are transmitted to OpenAI (for ChatGPT) and Anthropic (for Claude) API services to generate responses. 2BOTS does not store conversation transcripts — sessions exist only in server memory while active and are discarded when the session ends.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-bot-text mb-2">Voice Input</h3>
                <p className="text-bot-text leading-relaxed">
                  If you use the voice input feature, speech recognition is handled by your browser&apos;s built-in Web Speech API. Your voice audio is processed locally by your browser and is not sent to 2BOTS servers. Only the resulting text transcription is sent to our backend.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-bot-text mb-2">Browser Storage</h3>
                <p className="text-bot-text leading-relaxed">
                  2BOTS uses your browser&apos;s localStorage to track the number of conversations you&apos;ve started (to enforce the daily free tier limit) and to store your preferences and settings. No account or login is required. This data stays on your device and is not sent to our servers.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-bot-text mb-2">Technical Information</h3>
                <p className="text-bot-text leading-relaxed">
                  Our hosting provider (Render) may automatically collect standard server logs including IP addresses, browser type, and request timestamps. This is used for security, abuse prevention, and rate limiting.
                </p>
              </div>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-2xl font-semibold text-bot-text mb-4">2. How We Use Your Information</h2>
            <p className="text-bot-text leading-relaxed mb-4">
              We use the information described above for the following purposes:
            </p>
            <ul className="space-y-2 text-bot-text list-disc list-inside">
              <li>To provide the 2BOTS service (sending your inputs to AI APIs and returning responses)</li>
              <li>To enforce usage limits (free tier conversation limits via localStorage)</li>
              <li>To prevent abuse (IP-based rate limiting)</li>
              <li>To maintain and improve the service</li>
            </ul>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="text-2xl font-semibold text-bot-text mb-4">3. Third-Party Service Providers</h2>
            <p className="text-bot-text leading-relaxed mb-4">
              2BOTS relies on the following third-party services. Your data may be processed by:
            </p>
            <div className="bg-bot-panel rounded-lg p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-bot-text mb-1">Anthropic (Claude API)</h3>
                <p className="text-bot-muted text-sm">
                  Receives conversation inputs and generates responses. Subject to Anthropic&apos;s privacy policy and terms.
                </p>
              </div>
              <div className="border-t border-bot-text/10 pt-4">
                <h3 className="font-semibold text-bot-text mb-1">OpenAI (ChatGPT & Text-to-Speech APIs)</h3>
                <p className="text-bot-muted text-sm">
                  Receives conversation inputs, generates responses, and converts text to speech audio. Subject to OpenAI&apos;s privacy policy and terms.
                </p>
              </div>
              <div className="border-t border-bot-text/10 pt-4">
                <h3 className="font-semibold text-bot-text mb-1">Render (Hosting)</h3>
                <p className="text-bot-muted text-sm">
                  Hosts the 2BOTS frontend and backend services. May collect standard server logs. Subject to Render&apos;s privacy policy.
                </p>
              </div>
            </div>
            <p className="text-bot-text leading-relaxed mt-4">
              We recommend reviewing the privacy policies of these providers to understand how they handle your data.
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-semibold text-bot-text mb-4">4. Data Retention</h2>
            <p className="text-bot-text leading-relaxed">
              2BOTS does not maintain a database. Conversation sessions exist only in server memory while active and are lost when the server restarts or the session ends. We do not permanently store conversation content, user profiles, or usage history. Browser-side data (localStorage) can be cleared by you at any time through your browser settings.
            </p>
          </section>

          {/* User Rights */}
          <section>
            <h2 className="text-2xl font-semibold text-bot-text mb-4">5. Your Rights</h2>
            <p className="text-bot-text leading-relaxed mb-4">
              Since 2BOTS does not store personal data in a database or require accounts, there is minimal personal data to manage. However, you have the right to:
            </p>
            <ul className="space-y-3 text-bot-text list-disc list-inside">
              <li><span className="font-semibold">Clear local data:</span> Delete localStorage data through your browser settings at any time.</li>
              <li><span className="font-semibold">Request information:</span> Contact us to ask what data, if any, we hold about you.</li>
              <li><span className="font-semibold">Request deletion:</span> Contact us to request deletion of any data associated with you.</li>
            </ul>
            <p className="text-bot-text leading-relaxed mt-4">
              If you are in the EU/UK (GDPR) or California (CCPA), you have additional rights under those regulations. Contact us at support@2bots.ai to exercise any data rights.
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-semibold text-bot-text mb-4">6. Children&apos;s Privacy</h2>
            <p className="text-bot-text leading-relaxed">
              2BOTS is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe a child under 13 has used 2BOTS, please contact us at support@2bots.ai.
            </p>
          </section>

          {/* International */}
          <section>
            <h2 className="text-2xl font-semibold text-bot-text mb-4">7. International Data Transfers</h2>
            <p className="text-bot-text leading-relaxed">
              2BOTS services are hosted in the United States. Your conversation data is transmitted to Anthropic and OpenAI, which operate primarily in the United States. By using 2BOTS, you consent to the transfer of your data to the United States.
            </p>
          </section>

          {/* Changes */}
          <section>
            <h2 className="text-2xl font-semibold text-bot-text mb-4">8. Changes to This Privacy Policy</h2>
            <p className="text-bot-text leading-relaxed">
              We may update this Privacy Policy periodically. We will notify you of changes by updating the &quot;Last updated&quot; date on this page. Your continued use of 2BOTS after changes are posted constitutes your acceptance of the updated Privacy Policy.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold text-bot-text mb-4">9. Contact Us</h2>
            <p className="text-bot-text leading-relaxed mb-4">
              If you have questions about this Privacy Policy or wish to exercise your data rights, please contact us:
            </p>
            <div className="bg-bot-panel rounded-lg p-6 space-y-2">
              <p className="text-bot-text">
                <span className="font-semibold">Email:</span> support@2bots.ai
              </p>
              <p className="text-bot-text">
                <span className="font-semibold">Website:</span> 2bots.ai
              </p>
            </div>
          </section>

          {/* Footer */}
          <section className="border-t border-bot-text/10 pt-8 mt-12">
            <p className="text-bot-muted text-sm">
              By using 2BOTS, you acknowledge that you have read and understood this Privacy Policy. If you do not agree with any part of this policy, please refrain from using our service.
            </p>
          </section>
        </div>
      </div>

      {/* Bottom spacing */}
      <div className="h-16" />
    </div>
  );
}
