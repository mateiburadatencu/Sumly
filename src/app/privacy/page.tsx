export default function PrivacyPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-extrabold text-slate-900">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-400">Last updated: March 2026</p>

        <div className="mt-10 space-y-8 text-slate-600">

          <section>
            <h2 className="text-lg font-bold text-slate-800">1. Introduction</h2>
            <p className="mt-3 leading-relaxed">
              AGROMAR PROD SRL ("we", "us", "our") operates Sumly ("Service"). This Privacy Policy explains how we collect, use, and protect your information when you use our Service. By using Sumly, you agree to the collection and use of information as described in this policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800">2. Information We Collect</h2>
            <p className="mt-3 font-semibold text-slate-700">Information you provide:</p>
            <ul className="mt-2 list-disc space-y-2 pl-6 leading-relaxed">
              <li>Email address and name when you create an account</li>
              <li>Payment information (processed securely by Stripe — we do not store card details)</li>
              <li>YouTube URLs you submit for summarization</li>
            </ul>
            <p className="mt-4 font-semibold text-slate-700">Information collected automatically:</p>
            <ul className="mt-2 list-disc space-y-2 pl-6 leading-relaxed">
              <li>IP address (used for rate limiting and abuse prevention)</li>
              <li>Usage data including number of summaries generated and plan type</li>
              <li>Summary history associated with your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800">3. How We Use Your Information</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6 leading-relaxed">
              <li>To provide and operate the Service</li>
              <li>To manage your account and subscription</li>
              <li>To enforce usage limits and prevent abuse of free trials</li>
              <li>To improve the Service and fix issues</li>
              <li>To send transactional emails related to your account (e.g. billing)</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800">4. Third-Party Services</h2>
            <p className="mt-3 leading-relaxed">We use the following third-party services to operate Sumly:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6 leading-relaxed">
              <li><span className="font-medium text-slate-700">Supabase</span> — stores your account data, usage history, and summaries securely</li>
              <li><span className="font-medium text-slate-700">OpenAI</span> — processes video transcripts to generate AI summaries. Transcripts are sent to OpenAI's API and are subject to <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">OpenAI's Privacy Policy</a></li>
              <li><span className="font-medium text-slate-700">Stripe</span> — handles payment processing. Card data never touches our servers and is governed by <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">Stripe's Privacy Policy</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800">5. Data Retention</h2>
            <p className="mt-3 leading-relaxed">
              We retain your account data for as long as your account is active. Generated summaries are cached to improve performance and reduce costs. If you delete your account, your personal data is removed from our systems within 30 days, except where retention is required by law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800">6. Cookies</h2>
            <p className="mt-3 leading-relaxed">
              We use session cookies strictly necessary for authentication. We do not use tracking cookies or advertising cookies. By using the Service, you consent to the use of authentication cookies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800">7. Your Rights (GDPR)</h2>
            <p className="mt-3 leading-relaxed">
              As a user based in the European Union or Romania, you have the following rights under GDPR:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 leading-relaxed">
              <li><span className="font-medium text-slate-700">Right of access</span> — request a copy of the data we hold about you</li>
              <li><span className="font-medium text-slate-700">Right to rectification</span> — request correction of inaccurate data</li>
              <li><span className="font-medium text-slate-700">Right to erasure</span> — request deletion of your personal data</li>
              <li><span className="font-medium text-slate-700">Right to data portability</span> — receive your data in a machine-readable format</li>
              <li><span className="font-medium text-slate-700">Right to object</span> — object to certain types of data processing</li>
            </ul>
            <p className="mt-3 leading-relaxed">
              To exercise any of these rights, contact us at{' '}
              <a href="mailto:viralpersona@gmail.com" className="font-medium text-red-600 hover:underline">
                viralpersona@gmail.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800">8. Data Security</h2>
            <p className="mt-3 leading-relaxed">
              We implement industry-standard security measures including encrypted connections (HTTPS), secure authentication via Supabase Auth, and row-level security on our database. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800">9. Children's Privacy</h2>
            <p className="mt-3 leading-relaxed">
              The Service is not directed at children under the age of 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us and we will delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800">10. Changes to This Policy</h2>
            <p className="mt-3 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of significant changes by updating the date at the top of this page. Continued use of the Service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800">11. Contact</h2>
            <p className="mt-3 leading-relaxed">
              For any privacy-related questions or requests, contact us at{' '}
              <a href="mailto:viralpersona@gmail.com" className="font-medium text-red-600 hover:underline">
                viralpersona@gmail.com
              </a>
              {' '}or write to: AGROMAR PROD SRL, Romania.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
