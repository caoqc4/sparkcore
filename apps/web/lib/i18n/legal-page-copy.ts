import { getLocalizedValue, type LocalizedValue } from "@/lib/i18n/localized";
import type { AppLanguage } from "@/lib/i18n/site";

type LegalSection = {
  title: string;
  paragraphs: string[];
  bullets?: Array<{
    label?: string;
    text: string;
  }>;
};

type LegalPageCopy = {
  eyebrow: string;
  title: string;
  description: string;
  sections: LegalSection[];
  links: {
    primary: string;
    secondary: string;
  };
};

const PRIVACY_COPY: LocalizedValue<LegalPageCopy> = {
  "zh-CN": {
    eyebrow: "隐私政策",
    title: "我们如何处理你的数据。",
    description: "最后更新：2026 年 3 月 30 日",
    sections: [
      {
        title: "1. 我们收集的信息",
        paragraphs: [
          "我们会收集你直接提供的信息，例如账户注册信息（邮箱地址、用户名）、伴侣配置数据，以及为实现记忆与关系连续性所必需的对话内容。",
          "我们也会自动收集使用数据，包括设备类型、IP 地址、浏览器类型、访问页面和交互时间戳，以便运营和改进服务。",
        ],
      },
      {
        title: "2. 我们如何使用你的信息",
        paragraphs: ["我们收集的信息将用于："],
        bullets: [
          { text: "提供、运营并改进 Lagun 服务" },
          { text: "在不同会话间维持伴侣记忆与关系状态" },
          { text: "通过已连接的 IM 渠道发送消息" },
          { text: "验证账户身份并保障安全" },
          { text: "发送与服务相关的通知，例如账单或安全提醒" },
          { text: "履行法律义务" },
        ],
      },
      {
        title: "3. 记忆与对话数据",
        paragraphs: [
          "对话历史和由其衍生的记忆条目会被存储，用于支撑 Lagun 的长期记忆能力。你可以随时通过记忆中心查看已存储记忆、标记错误条目或删除它们。删除记忆条目后，它将不再进入伴侣使用的活动上下文。",
        ],
      },
      {
        title: "4. IM 渠道集成",
        paragraphs: [
          "当你连接 IM 渠道后，Lagun 会接收通过该渠道发送给你的伴侣的消息。我们不会存储该 IM 账户中其他对话的完整历史，只会处理发送给你的 Lagun 伴侣的消息。",
        ],
      },
      {
        title: "5. 支付数据",
        paragraphs: [
          "Lagun 提供付费订阅方案。支付由第三方支付处理方（Creem）完成。当你购买订阅或积分时，银行卡信息会直接输入到支付方的安全表单中，不会存储在 Lagun 服务器上。我们只接收非敏感的交易确认和你的订阅状态。",
          "我们会保留管理订阅、处理退款以及履行税务和会计义务所需的账单记录（交易 ID、购买金额、日期）。",
        ],
      },
      {
        title: "6. 数据共享",
        paragraphs: ["我们不会出售你的个人数据。我们仅在以下情况下共享数据："],
        bullets: [
          {
            label: "支付处理方",
            text: "用于处理订阅付款和积分购买。这些处理方符合 PCI-DSS 标准，并依据其自身隐私政策处理卡数据。",
          },
          {
            label: "服务提供商",
            text: "帮助我们运营基础设施或提供 AI 能力的第三方供应商，并受保密义务约束。",
          },
          {
            label: "法律要求",
            text: "在法律、法院命令要求，或为保护用户及公众权利与安全时。",
          },
        ],
      },
      {
        title: "7. 数据保留",
        paragraphs: [
          "只要你的账户处于活跃状态，我们就会保留账户数据和对话历史。你可以随时联系我们申请删除账户及相关数据。部分数据可能会因履行法律义务或处理争议而在有限时间内保留。",
        ],
      },
      {
        title: "8. 安全",
        paragraphs: [
          "我们采用行业标准安全措施，包括传输与存储加密、访问控制和定期安全审查。但没有任何系统可以完全避免安全事件；若发生影响你数据的泄露，我们会及时通知你。",
        ],
      },
      {
        title: "9. 未成年人",
        paragraphs: [
          "Lagun 不面向 18 岁以下用户。我们不会主动收集未成年人的个人数据。如果发现收集到了 18 岁以下用户的数据，我们会及时删除。",
        ],
      },
      {
        title: "10. 你的权利",
        paragraphs: [
          "根据你所在司法辖区的规定，你可能拥有访问、更正、导出或删除个人数据的权利。如需行使这些权利，请通过下方联系方式联系我们。我们会在适用法律要求的期限内回复。",
        ],
      },
      {
        title: "11. 本政策的变更",
        paragraphs: [
          "我们可能会不时更新本隐私政策。重大变更会通过电子邮件或产品内显著提示告知。变更生效后继续使用 Lagun，即表示你接受更新后的政策。",
        ],
      },
      {
        title: "12. 联系方式",
        paragraphs: ["如有隐私相关问题或请求，请联系：support@lagun.app"],
      },
    ],
    links: {
      primary: "服务条款",
      secondary: "查看隐私控制",
    },
  },
  en: {
    eyebrow: "Privacy Policy",
    title: "How we handle your data.",
    description: "Last updated: March 30, 2026",
    sections: [
      {
        title: "1. Information We Collect",
        paragraphs: [
          "We collect information you provide directly, such as account registration details (email address, username), companion configuration data, and conversation content necessary to deliver memory and relationship continuity features.",
          "We also collect usage data automatically, including device type, IP address, browser type, pages visited, and interaction timestamps, to operate and improve the service.",
        ],
      },
      {
        title: "2. How We Use Your Information",
        paragraphs: ["We use the information we collect to:"],
        bullets: [
          { text: "Provide, operate, and improve the Lagun service" },
          { text: "Maintain companion memory and relationship state across sessions" },
          { text: "Deliver messages through connected IM channels" },
          { text: "Authenticate your account and keep it secure" },
          { text: "Send service-related communications (e.g., billing, security alerts)" },
          { text: "Comply with legal obligations" },
        ],
      },
      {
        title: "3. Memory and Conversation Data",
        paragraphs: [
          "Conversation history and derived memory entries are stored to power the long-memory features that are core to Lagun. You can review stored memories at any time via the Memory Center, mark entries as incorrect, or delete them. Deleting a memory entry removes it from the active context used by your companion.",
        ],
      },
      {
        title: "4. IM Channel Integrations",
        paragraphs: [
          "When you connect an IM channel, Lagun receives messages sent to your companion through that channel. We do not store the full message history of other conversations in connected IM accounts, only messages addressed to your Lagun companion.",
        ],
      },
      {
        title: "5. Payment Data",
        paragraphs: [
          "Lagun offers paid subscription plans. Payment processing is handled by our third-party payment processor (Creem). When you purchase a subscription or credits, your payment card details are entered directly on the payment processor's secure form and are never stored on Lagun servers. We receive only a non-sensitive transaction confirmation and your subscription status.",
          "We retain billing records (transaction IDs, purchase amounts, dates) necessary to manage your subscription, process refunds, and comply with tax and accounting obligations.",
        ],
      },
      {
        title: "6. Data Sharing",
        paragraphs: ["We do not sell your personal data. We share data only with:"],
        bullets: [
          {
            label: "Payment processors",
            text: "to process subscription payments and credits purchases. These processors are PCI-DSS compliant and handle card data under their own privacy policies.",
          },
          {
            label: "Service providers",
            text: "third-party vendors who help us operate infrastructure or deliver AI capabilities, bound by confidentiality obligations.",
          },
          {
            label: "Legal requirements",
            text: "when required by law, court order, or to protect the rights and safety of users and the public.",
          },
        ],
      },
      {
        title: "7. Data Retention",
        paragraphs: [
          "We retain your account data and conversation history for as long as your account is active. You may request deletion of your account and associated data at any time by contacting us. Some data may be retained for a limited period to comply with legal obligations or resolve disputes.",
        ],
      },
      {
        title: "8. Security",
        paragraphs: [
          "We implement industry-standard security measures including encryption in transit and at rest, access controls, and regular security reviews. No system is completely immune to breaches; we will notify you promptly if a breach affects your data.",
        ],
      },
      {
        title: "9. Children",
        paragraphs: [
          "Lagun is not intended for users under 18 years of age. We do not knowingly collect personal data from minors. If we learn that we have collected data from a user under 18, we will delete it promptly.",
        ],
      },
      {
        title: "10. Your Rights",
        paragraphs: [
          "Depending on your jurisdiction, you may have the right to access, correct, export, or delete your personal data. To exercise these rights, contact us at the address below. We will respond within the timeframe required by applicable law.",
        ],
      },
      {
        title: "11. Changes to This Policy",
        paragraphs: [
          "We may update this privacy policy from time to time. Material changes will be communicated via email or a prominent notice in the product. Continued use of Lagun after changes take effect constitutes acceptance of the updated policy.",
        ],
      },
      {
        title: "12. Contact",
        paragraphs: ["For privacy-related questions or requests, contact us at: support@lagun.app"],
      },
    ],
    links: {
      primary: "Terms of Service",
      secondary: "Review privacy controls",
    },
  },
};

const TERMS_COPY: LocalizedValue<LegalPageCopy> = {
  "zh-CN": {
    eyebrow: "服务条款",
    title: "使用 Lagun 的规则。",
    description: "最后更新：2026 年 3 月 30 日",
    sections: [
      {
        title: "1. 条款接受",
        paragraphs: ["创建账户或使用 Lagun 即表示你同意本服务条款及我们的隐私政策。如果你不同意，请不要使用本服务。"],
      },
      {
        title: "2. 使用资格",
        paragraphs: ["你必须年满 18 周岁才能使用 Lagun。使用本服务即表示你满足这一要求。我们保留终止未成年人账户的权利。"],
      },
      {
        title: "3. 你的账户",
        paragraphs: ["你有责任保护登录凭证的机密性，并对账户下发生的所有活动负责。如怀疑存在未经授权的访问，请立即通过 support@lagun.app 联系我们。"],
      },
      {
        title: "4. 可接受使用",
        paragraphs: ["你同意不会将 Lagun 用于以下行为：", "我们保留在不事先通知的情况下暂停或终止违反这些规则账户的权利。"],
        bullets: [
          { text: "违反任何适用法律或法规" },
          { text: "骚扰、威胁或伤害其他用户或第三方" },
          { text: "生成涉及未成年人的性化内容" },
          { text: "尝试逆向工程、抓取或提取模型权重或系统提示" },
          { text: "绕过速率限制、身份验证或其他技术控制" },
          { text: "冒充他人或虚构身份" },
          { text: "将服务用于任何非法商业目的" },
        ],
      },
      {
        title: "5. AI 生成内容",
        paragraphs: ["Lagun 使用大语言模型生成回复。AI 回复可能偶尔不准确、不一致或出乎意料。请勿将伴侣回复用于医疗、法律、金融或安全关键决策。对于依赖 AI 生成内容造成的损害，我们不承担责任。"],
      },
      {
        title: "6. IM 渠道集成",
        paragraphs: ["连接第三方 IM 渠道还需遵守该平台自身的服务条款。Lagun 与任何第三方 IM 提供方均无附属或背书关系。你有责任确保在已连接渠道上的使用符合其政策。"],
      },
      {
        title: "7. 订阅与支付",
        paragraphs: [
          "Lagun 提供月付和年付订阅方案，以及一次性积分购买。所有付费计划均为预付费。支付由第三方支付处理方完成；你的银行卡信息不会存储在我们的服务器上。",
          "取消：你可随时在账户设置中取消订阅。取消会在当前计费周期结束时生效，在此之前仍可继续使用付费功能。",
          "退款：除适用法律另有要求外，订阅费用一般不予退款。如你认为存在误扣费，请在扣费后 14 天内通过 support@lagun.app 联系我们，我们会进行审核。",
          "积分：购买的积分不过期且不可转让。除法律另有要求外，未使用积分不予退款。",
          "价格变更：如订阅价格调整，我们将至少提前 30 天通知。变更生效后继续使用服务，即表示你接受新价格。",
        ],
      },
      {
        title: "8. 知识产权",
        paragraphs: ["Lagun 及其底层技术归我们所有，受版权、商标及其他知识产权法律保护。你保留对自己提供原创内容的所有权，但授予我们仅为运营服务所必需的使用许可，包括以匿名和聚合形式训练与改进 AI 模型。"],
      },
      {
        title: "9. 免责声明",
        paragraphs: ["本服务按“现状”和“可用性”提供，不附带任何明示或默示担保。我们不保证服务不中断、无错误或绝对安全。"],
      },
      {
        title: "10. 责任限制",
        paragraphs: ["在法律允许的最大范围内，Lagun 及其关联方对因你使用服务而产生的任何间接、附带、特殊、后果性或惩罚性损害，以及数据丢失，不承担责任。"],
      },
      {
        title: "11. 适用法律",
        paragraphs: ["本条款受 Lagun 注册地司法辖区法律管辖，不适用冲突法原则。争议将通过具有约束力的仲裁或该司法辖区法院解决。"],
      },
      {
        title: "12. 条款变更",
        paragraphs: ["我们可能会不时更新这些条款。重大变更将至少提前 14 天通知。变更生效后继续使用 Lagun，即表示你接受更新后的条款。"],
      },
      {
        title: "13. 联系方式",
        paragraphs: ["如对本条款有疑问，请联系：hello@lagun.app"],
      },
    ],
    links: {
      primary: "隐私政策",
      secondary: "安全说明",
    },
  },
  en: {
    eyebrow: "Terms of Service",
    title: "Rules for using Lagun.",
    description: "Last updated: March 30, 2026",
    sections: [
      {
        title: "1. Acceptance of Terms",
        paragraphs: ["By creating an account or using Lagun, you agree to these Terms of Service and our Privacy Policy. If you do not agree, do not use the service."],
      },
      {
        title: "2. Eligibility",
        paragraphs: ["You must be at least 18 years old to use Lagun. By using the service you represent that you meet this requirement. We reserve the right to terminate accounts found to belong to minors."],
      },
      {
        title: "3. Your Account",
        paragraphs: ["You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account. Notify us immediately at support@lagun.app if you suspect unauthorized access."],
      },
      {
        title: "4. Acceptable Use",
        paragraphs: ["You agree not to use Lagun to:", "We reserve the right to suspend or terminate accounts that violate these rules, without prior notice."],
        bullets: [
          { text: "Violate any applicable law or regulation" },
          { text: "Harass, threaten, or harm other users or third parties" },
          { text: "Generate content that sexualizes minors" },
          { text: "Attempt to reverse-engineer, scrape, or extract model weights or system prompts" },
          { text: "Circumvent rate limits, authentication, or other technical controls" },
          { text: "Misrepresent your identity or impersonate others" },
          { text: "Use the service for any illegal commercial purpose" },
        ],
      },
      {
        title: "5. AI-Generated Content",
        paragraphs: ["Lagun uses large language models to generate responses. AI responses may occasionally be inaccurate, inconsistent, or unexpected. Do not rely on companion responses for medical, legal, financial, or safety-critical decisions. We are not liable for harm arising from reliance on AI-generated content."],
      },
      {
        title: "6. IM Channel Integrations",
        paragraphs: ["Connecting a third-party IM channel is subject to the terms of service of that platform. Lagun is not affiliated with or endorsed by any third-party IM provider. You are responsible for ensuring your use of connected channels complies with their respective policies."],
      },
      {
        title: "7. Subscriptions and Payments",
        paragraphs: [
          "Lagun offers monthly and annual subscription plans, as well as one-time credits purchases. All paid plans are billed in advance. Payment is processed by our third-party payment processor; your card details are never stored on our servers.",
          "Cancellation: You may cancel your subscription at any time from your account settings. Cancellation takes effect at the end of the current billing period. Access to paid features continues until the period ends.",
          "Refunds: Subscription payments are generally non-refundable except where required by applicable law. If you believe you were charged in error, contact us within 14 days of the charge at support@lagun.app and we will review your case.",
          "Credits: Purchased credits are non-expiring and non-transferable. Unused credits are not refundable except where required by law.",
          "Price changes: We will provide at least 30 days notice before changing subscription prices. Continued use after the effective date constitutes acceptance of the new price.",
        ],
      },
      {
        title: "8. Intellectual Property",
        paragraphs: ["Lagun and its underlying technology are owned by us and protected by copyright, trademark, and other intellectual property laws. You retain ownership of original content you provide. You grant us a license to use that content solely to operate the service, including training and improving AI models in an anonymized and aggregated form."],
      },
      {
        title: "9. Disclaimers",
        paragraphs: ["The service is provided \"as is\" and \"as available\" without warranties of any kind, express or implied. We do not warrant uninterrupted, error-free, or secure operation of the service."],
      },
      {
        title: "10. Limitation of Liability",
        paragraphs: ["To the maximum extent permitted by law, Lagun and its affiliates shall not be liable for indirect, incidental, special, consequential, or punitive damages, or loss of data, arising out of or related to your use of the service."],
      },
      {
        title: "11. Governing Law",
        paragraphs: ["These terms are governed by the laws of the jurisdiction in which Lagun is incorporated, without regard to conflict of law principles. Disputes will be resolved through binding arbitration or in the courts of that jurisdiction."],
      },
      {
        title: "12. Changes to Terms",
        paragraphs: ["We may update these terms from time to time. Material changes will be communicated with at least 14 days notice. Continued use of Lagun after the effective date constitutes acceptance of the updated terms."],
      },
      {
        title: "13. Contact",
        paragraphs: ["Questions about these terms? Contact us at: hello@lagun.app"],
      },
    ],
    links: {
      primary: "Privacy Policy",
      secondary: "Safety guidelines",
    },
  },
};

export function getPrivacyCopy(language: AppLanguage) {
  return getLocalizedValue(language, PRIVACY_COPY);
}

export function getTermsCopy(language: AppLanguage) {
  return getLocalizedValue(language, TERMS_COPY);
}
