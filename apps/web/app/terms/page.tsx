import { PageFrame, SiteShell } from "@/components/site-shell";
import { TrackedLink } from "@/components/tracked-link";
import { buildPageMetadata } from "@/lib/site";

export const metadata = buildPageMetadata({
  title: "Terms of Service",
  description:
    "SparkCore terms of service — the rules and conditions that govern use of our IM-native AI companion platform.",
  path: "/terms"
});

export default function TermsPage() {
  return (
    <SiteShell>
      <PageFrame
        eyebrow="Terms of Service"
        title="Rules for using SparkCore."
        description="Last updated: March 30, 2026"
      >
        <div className="prose prose-invert max-w-none">
          <section>
            <h2>1. Acceptance of Terms</h2>
            <p>
              By creating an account or using SparkCore, you agree to these Terms of Service and
              our Privacy Policy. If you do not agree, do not use the service.
            </p>
          </section>

          <section>
            <h2>2. Eligibility</h2>
            <p>
              You must be at least 18 years old to use SparkCore. By using the service you
              represent that you meet this requirement. We reserve the right to terminate accounts
              found to belong to minors.
            </p>
          </section>

          <section>
            <h2>3. Your Account</h2>
            <p>
              You are responsible for maintaining the confidentiality of your login credentials
              and for all activity that occurs under your account. Notify us immediately at{" "}
              <strong>support@lagun.app</strong> if you suspect unauthorized access.
            </p>
          </section>

          <section>
            <h2>4. Acceptable Use</h2>
            <p>You agree not to use SparkCore to:</p>
            <ul>
              <li>Violate any applicable law or regulation</li>
              <li>Harass, threaten, or harm other users or third parties</li>
              <li>Generate content that sexualizes minors</li>
              <li>
                Attempt to reverse-engineer, scrape, or extract model weights or system prompts
              </li>
              <li>Circumvent rate limits, authentication, or other technical controls</li>
              <li>Misrepresent your identity or impersonate others</li>
              <li>Use the service for any illegal commercial purpose</li>
            </ul>
            <p>
              We reserve the right to suspend or terminate accounts that violate these rules,
              without prior notice.
            </p>
          </section>

          <section>
            <h2>5. AI-Generated Content</h2>
            <p>
              SparkCore uses large language models to generate responses. AI responses may
              occasionally be inaccurate, inconsistent, or unexpected. Do not rely on companion
              responses for medical, legal, financial, or safety-critical decisions. We are not
              liable for harm arising from reliance on AI-generated content.
            </p>
          </section>

          <section>
            <h2>6. IM Channel Integrations</h2>
            <p>
              Connecting a third-party IM channel is subject to the terms of service of that
              platform. SparkCore is not affiliated with or endorsed by any third-party IM
              provider. You are responsible for ensuring your use of connected channels complies
              with their respective policies.
            </p>
          </section>

          <section>
            <h2>7. Subscriptions and Payments</h2>
            <p>
              SparkCore offers monthly and annual subscription plans, as well as one-time credits
              purchases. All paid plans are billed in advance. Payment is processed by our
              third-party payment processor; your card details are never stored on our servers.
            </p>
            <p>
              <strong>Cancellation:</strong> You may cancel your subscription at any time from
              your account settings. Cancellation takes effect at the end of the current billing
              period. Access to paid features continues until the period ends.
            </p>
            <p>
              <strong>Refunds:</strong> Subscription payments are generally non-refundable except
              where required by applicable law. If you believe you were charged in error, contact
              us within 14 days of the charge at{" "}
              <strong>support@lagun.app</strong> and we will review your case.
            </p>
            <p>
              <strong>Credits:</strong> Purchased credits are non-expiring and non-transferable.
              Unused credits are not refundable except where required by law.
            </p>
            <p>
              <strong>Price changes:</strong> We will provide at least 30 days notice before
              changing subscription prices. Continued use after the effective date constitutes
              acceptance of the new price.
            </p>
          </section>

          <section>
            <h2>8. Intellectual Property</h2>
            <p>
              SparkCore and its underlying technology are owned by us and protected by copyright,
              trademark, and other intellectual property laws. You retain ownership of original
              content you provide. You grant us a license to use that content solely to operate
              the service, including training and improving AI models in an anonymized and
              aggregated form.
            </p>
          </section>

          <section>
            <h2>9. Disclaimers</h2>
            <p>
              The service is provided "as is" and "as available" without warranties of any kind,
              express or implied. We do not warrant uninterrupted, error-free, or secure operation
              of the service.
            </p>
          </section>

          <section>
            <h2>10. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, SparkCore and its affiliates shall not be
              liable for indirect, incidental, special, consequential, or punitive damages, or
              loss of data, arising out of or related to your use of the service.
            </p>
          </section>

          <section>
            <h2>11. Governing Law</h2>
            <p>
              These terms are governed by the laws of the jurisdiction in which SparkCore is
              incorporated, without regard to conflict of law principles. Disputes will be resolved
              through binding arbitration or in the courts of that jurisdiction.
            </p>
          </section>

          <section>
            <h2>12. Changes to Terms</h2>
            <p>
              We may update these terms from time to time. Material changes will be communicated
              with at least 14 days notice. Continued use of SparkCore after the effective date
              constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2>13. Contact</h2>
            <p>
              Questions about these terms? Contact us at:{" "}
              <strong>hello@lagun.app</strong>
            </p>
          </section>
        </div>

        <div className="toolbar">
          <TrackedLink
            className="button button-secondary"
            event="landing_cta_click"
            href="/privacy"
            payload={{ source: "terms_privacy" }}
          >
            Privacy Policy
          </TrackedLink>
          <TrackedLink
            className="site-inline-link"
            event="landing_cta_click"
            href="/safety"
            payload={{ source: "terms_safety" }}
          >
            Safety guidelines
          </TrackedLink>
        </div>
      </PageFrame>
    </SiteShell>
  );
}
