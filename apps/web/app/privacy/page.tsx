import { PageFrame, SiteShell } from "@/components/site-shell";
import { TrackedLink } from "@/components/tracked-link";
import { buildPageMetadata } from "@/lib/site";

export const metadata = buildPageMetadata({
  title: "Privacy Policy",
  description:
    "SparkCore privacy policy — how we collect, use, and protect your personal data in our IM-native AI companion product.",
  path: "/privacy"
});

export default function PrivacyPage() {
  return (
    <SiteShell>
      <PageFrame
        eyebrow="Privacy Policy"
        title="How we handle your data."
        description="Last updated: March 30, 2026"
      >
        <div className="prose prose-invert max-w-none">
          <section>
            <h2>1. Information We Collect</h2>
            <p>
              We collect information you provide directly, such as account registration details
              (email address, username), companion configuration data, and conversation content
              necessary to deliver memory and relationship continuity features.
            </p>
            <p>
              We also collect usage data automatically, including device type, IP address, browser
              type, pages visited, and interaction timestamps, to operate and improve the service.
            </p>
          </section>

          <section>
            <h2>2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide, operate, and improve the SparkCore service</li>
              <li>Maintain companion memory and relationship state across sessions</li>
              <li>Deliver messages through connected IM channels</li>
              <li>Authenticate your account and keep it secure</li>
              <li>Send service-related communications (e.g., billing, security alerts)</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2>3. Memory and Conversation Data</h2>
            <p>
              Conversation history and derived memory entries are stored to power the long-memory
              features that are core to SparkCore. You can review stored memories at any time via
              the Memory Center, mark entries as incorrect, or delete them. Deleting a memory entry
              removes it from the active context used by your companion.
            </p>
          </section>

          <section>
            <h2>4. IM Channel Integrations</h2>
            <p>
              When you connect an IM channel, SparkCore receives messages sent to your companion
              through that channel. We do not store the full message history of other conversations
              in connected IM accounts — only messages addressed to your SparkCore companion.
            </p>
          </section>

          <section>
            <h2>5. Payment Data</h2>
            <p>
              SparkCore offers paid subscription plans. Payment processing is handled by our
              third-party payment processor (Creem). When you purchase a subscription or credits,
              your payment card details are entered directly on the payment processor's secure
              form and are never stored on SparkCore servers. We receive only a non-sensitive
              transaction confirmation and your subscription status.
            </p>
            <p>
              We retain billing records (transaction IDs, purchase amounts, dates) necessary to
              manage your subscription, process refunds, and comply with tax and accounting
              obligations.
            </p>
          </section>

          <section>
            <h2>6. Data Sharing</h2>
            <p>
              We do not sell your personal data. We share data only with:
            </p>
            <ul>
              <li>
                <strong>Payment processors</strong> — to process subscription payments and credits
                purchases. These processors are PCI-DSS compliant and handle card data under their
                own privacy policies.
              </li>
              <li>
                <strong>Service providers</strong> — third-party vendors who help us operate
                infrastructure or deliver AI capabilities, bound by confidentiality obligations.
              </li>
              <li>
                <strong>Legal requirements</strong> — when required by law, court order, or to
                protect the rights and safety of users and the public.
              </li>
            </ul>
          </section>

          <section>
            <h2>7. Data Retention</h2>
            <p>
              We retain your account data and conversation history for as long as your account is
              active. You may request deletion of your account and associated data at any time by
              contacting us. Some data may be retained for a limited period to comply with legal
              obligations or resolve disputes.
            </p>
          </section>

          <section>
            <h2>8. Security</h2>
            <p>
              We implement industry-standard security measures including encryption in transit and
              at rest, access controls, and regular security reviews. No system is completely
              immune to breaches; we will notify you promptly if a breach affects your data.
            </p>
          </section>

          <section>
            <h2>9. Children</h2>
            <p>
              SparkCore is not intended for users under 18 years of age. We do not knowingly
              collect personal data from minors. If we learn that we have collected data from a
              user under 18, we will delete it promptly.
            </p>
          </section>

          <section>
            <h2>10. Your Rights</h2>
            <p>
              Depending on your jurisdiction, you may have the right to access, correct, export,
              or delete your personal data. To exercise these rights, contact us at the address
              below. We will respond within the timeframe required by applicable law.
            </p>
          </section>

          <section>
            <h2>11. Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. Material changes will be
              communicated via email or a prominent notice in the product. Continued use of
              SparkCore after changes take effect constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2>12. Contact</h2>
            <p>
              For privacy-related questions or requests, contact us at:{" "}
              <strong>privacy@sparkcore.ai</strong>
            </p>
          </section>
        </div>

        <div className="toolbar">
          <TrackedLink
            className="button button-secondary"
            event="landing_cta_click"
            href="/terms"
            payload={{ source: "privacy_terms" }}
          >
            Terms of Service
          </TrackedLink>
          <TrackedLink
            className="site-inline-link"
            event="landing_cta_click"
            href="/features/privacy-controls"
            payload={{ source: "privacy_controls" }}
          >
            Review privacy controls
          </TrackedLink>
        </div>
      </PageFrame>
    </SiteShell>
  );
}
