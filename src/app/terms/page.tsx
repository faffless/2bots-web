'use client';

import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-bot-bg text-bot-text">
      {/* Header */}
      <div className="bg-bot-panel border-b border-bot-text/10">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold">Terms of Service</h1>
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
              Welcome to 2BOTS (2bots.io). These Terms of Service govern your use of our web application and services. By accessing or using 2BOTS, you agree to be bound by these terms. If you do not agree to any part of these terms, you may not use our service.
            </p>
          </section>

          {/* Service Description */}
          <section>
            <h2 className="text-2xl font-semibold text-bot-text mb-4">1. Service Description</h2>
            <p className="text-bot-text leading-relaxed">
              2BOTS is a web application that enables users to interact with multiple AI models simultaneously. The service allows you to have conversations with Claude (powered by Anthropic) and ChatGPT (powered by OpenAI) in a single interface. These AI models can engage with your prompts, provide responses, and interact with each other's output, allowing for richer discussion and comparison of perspectives.
            </p>
          </section>

          {/* Pricing & Usage Tiers */}
          <section>
            <h2 className="text-2xl font-semibold text-bot-text mb-4">2. Pricing & Usage Tiers</h2>
            <p className="text-bot-text leading-relaxed mb-4">
              2BOTS offers two service tiers:
            </p>
            <div className="bg-bot-panel rounded-lg p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-bot-text mb-2">Free Tier</h3>
                <p className="text-bot-muted">
                  Users may start up to 3 conversations per day at no cost. Each conversation can include multiple turns of dialogue with both AI models. The free tier is intended for casual exploration and testing of the service.
                </p>
              </div>
              <div className="border-t border-bot-text/10 pt-4">
                <h3 className="font-semibold text-bot-text mb-2">Pro Tier</h3>
                <p className="text-bot-muted">
                  For $9.99 per month, Pro subscribers enjoy unlimited conversations and turns. Billing is handled through Stripe and will recur monthly unless cancelled. You may cancel your subscription at any time through your account settings.
                </p>
              </div>
            </div>
          </section>

          {/* User Responsibilities */}
          <section>
            <h2 className="text-2xl font-semibold text-bot-text mb-4">3. User Responsibilities & Acceptable Use</h2>
            <p className="text-bot-text leading-relaxed mb-4">
              You agree not to use 2BOTS for any unlawful, harmful, or abusive purposes. Specifically, you may not:
            </p>
            <ul className="space-y-2 text-bot-text list-disc list-inside">
              <li>Use the service to generate, distribute, or promote illegal content</li>
              <li>Attempt to circumvent usage limits or reverse-engineer the application</li>
              <li>Use the service to harass, defame, or threaten individuals</li>
              <li>Generate content that violates intellectual property rights</li>
              <li>Use the service in violation of any applicable laws or regulations</li>
              <li>Attempt to gain unauthorized access to systems or user data</li>
            </ul>
            <p className="text-bot-text leading-relaxed mt-4">
              We reserve the right to suspend or terminate your account if we determine that you have violated these acceptable use policies.
            </p>
          </section>

          {/* Third-Party APIs */}
          <section>
            <h2 className="text-2xl font-semibold text-bot-text mb-4">4. Third-Party AI Services</h2>
            <p className="text-bot-text leading-relaxed mb-4">
              2BOTS relies on third-party AI service providers to deliver its core functionality:
            </p>
            <p className="text-bot-text leading-relaxed mb-4">
              All conversations are processed through APIs provided by Anthropic (for Claude) and OpenAI (for ChatGPT). Your inputs and outputs may be subject to their respective terms of service, privacy policies, and usage policies. By using 2BOTS, you acknowledge and agree to comply with the terms set by these third-party providers.
            </p>
            <p className="text-bot-text leading-relaxed">
              2BOTS is not responsible for the availability, performance, or accuracy of responses from these third-party services. The quality and behavior of AI responses are subject to the capabilities and limitations of the respective models. We recommend reviewing Anthropic's and OpenAI's terms and privacy policies for information on how they handle your data.
            </p>
          </section>

          {/* Disclaimer & Liability */}
          <section>
            <h2 className="text-2xl font-semibold text-bot-text mb-4">5. Disclaimer & Limitation of Liability</h2>
            <p className="text-bot-text leading-relaxed mb-4">
              2BOTS is provided "as is" without warranties of any kind, either express or implied. We make no guarantee regarding the accuracy, reliability, completeness, or fitness for any particular purpose of the service or the responses generated by AI models.
            </p>
            <p className="text-bot-text leading-relaxed mb-4">
              To the fullest extent permitted by law, 2BOTS shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service, including but not limited to loss of data, revenue, or business opportunity.
            </p>
            <p className="text-bot-text leading-relaxed">
              You use this service entirely at your own risk. We strongly recommend that you do not rely solely on AI responses for critical decisions, medical advice, legal counsel, or financial matters. Always verify important information with qualified professionals.
            </p>
          </section>

          {/* Payment Terms */}
          <section>
            <h2 className="text-2xl font-semibold text-bot-text mb-4">6. Payment Terms</h2>
            <p className="text-bot-text leading-relaxed mb-4">
              Pro tier subscriptions are billed monthly at $9.99 USD (or your local currency equivalent). Billing is processed through Stripe, a third-party payment processor. Your payment information is encrypted and handled securely by Stripe.
            </p>
            <p className="text-bot-text leading-relaxed mb-4">
              You are responsible for providing accurate billing information and keeping your payment method current. If a payment fails, we may suspend your Pro tier access until the issue is resolved.
            </p>
            <p className="text-bot-text leading-relaxed">
              You may cancel your Pro subscription at any time. Cancellation takes effect at the end of your current billing cycle. We do not offer refunds for partial months unless required by applicable law.
            </p>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-2xl font-semibold text-bot-text mb-4">7. Termination</h2>
            <p className="text-bot-text leading-relaxed mb-4">
              We reserve the right to suspend or terminate your access to 2BOTS at any time, with or without cause, and with or without notice. Causes for termination include but are not limited to:
            </p>
            <ul className="space-y-2 text-bot-text list-disc list-inside">
              <li>Violation of these Terms of Service</li>
              <li>Violation of applicable law</li>
              <li>Abuse of the service or other users</li>
              <li>Non-payment of subscription fees (for Pro tier)</li>
            </ul>
            <p className="text-bot-text leading-relaxed mt-4">
              Upon termination, your access to the service will be immediately revoked. Any data associated with your account may be deleted in accordance with our retention policies.
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-2xl font-semibold text-bot-text mb-4">8. Changes to Terms</h2>
            <p className="text-bot-text leading-relaxed">
              We may update these Terms of Service at any time. We will notify users of material changes by updating the "Last updated" date on this page. Your continued use of 2BOTS after any changes constitutes your acceptance of the new terms. We encourage you to review this page periodically to stay informed of any updates.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold text-bot-text mb-4">9. Contact Us</h2>
            <p className="text-bot-text leading-relaxed mb-4">
              If you have questions about these Terms of Service, concerns about the service, or wish to report a violation, please contact us:
            </p>
            <div className="bg-bot-panel rounded-lg p-6 space-y-2">
              <p className="text-bot-text">
                <span className="font-semibold">Email:</span> support@2bots.io
              </p>
              <p className="text-bot-text">
                <span className="font-semibold">Website:</span> 2bots.io
              </p>
            </div>
          </section>

          {/* Footer */}
          <section className="border-t border-bot-text/10 pt-8 mt-12">
            <p className="text-bot-muted text-sm">
              By using 2BOTS, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree with any part of these terms, please refrain from using our service.
            </p>
          </section>
        </div>
      </div>

      {/* Bottom spacing */}
      <div className="h-16" />
    </div>
  );
}
