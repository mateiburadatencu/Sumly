export default function TermsPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-extrabold text-slate-900">Terms of Service</h1>
        <p className="mt-2 text-sm text-slate-400">Last updated: March 2026</p>

        <div className="mt-10 space-y-8 text-slate-600">

          <section>
            <h2 className="text-lg font-bold text-slate-800">1. Agreement to Terms</h2>
            <p className="mt-3 leading-relaxed">
              By accessing or using Sumly ("Service"), operated by AGROMAR PROD SRL ("Company", "we", "us"), you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800">2. Description of Service</h2>
            <p className="mt-3 leading-relaxed">
              Sumly is an AI-powered tool that generates structured summaries of YouTube videos. The Service uses artificial intelligence to process publicly available video transcripts and produce educational content, cheat sheets, and structured notes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800">3. User Accounts</h2>
            <p className="mt-3 leading-relaxed">
              To access certain features you must register for an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate and complete information when creating an account. You may not use another person's account without permission.
            </p>
            <p className="mt-3 leading-relaxed">
              We reserve the right to terminate accounts that violate these terms, including accounts created to circumvent usage limits or free trial restrictions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800">4. Subscription Plans and Payments</h2>
            <p className="mt-3 leading-relaxed">
              Sumly offers free and paid subscription plans. Paid plans are billed on a monthly or annual basis through Stripe. By subscribing to a paid plan, you authorize us to charge your payment method on a recurring basis.
            </p>
            <p className="mt-3 leading-relaxed">
              Free trials are provided at our discretion and are limited to one per user and per household (IP address). Creating multiple accounts to obtain additional free trials is a violation of these terms and may result in account termination.
            </p>
            <p className="mt-3 leading-relaxed">
              Subscriptions automatically renew unless cancelled before the renewal date. Refunds are issued at our discretion and only where required by applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800">5. Acceptable Use</h2>
            <p className="mt-3 leading-relaxed">You agree not to:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6 leading-relaxed">
              <li>Use the Service for any unlawful purpose or in violation of any regulations</li>
              <li>Attempt to circumvent usage limits, rate limits, or access restrictions</li>
              <li>Use automated scripts or bots to make bulk requests to the Service</li>
              <li>Resell, sublicense, or redistribute the Service or its outputs without prior written consent</li>
              <li>Submit YouTube URLs containing illegal, harmful, or infringing content</li>
              <li>Attempt to reverse-engineer, decompile, or extract the underlying AI models or source code</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800">6. Intellectual Property</h2>
            <p className="mt-3 leading-relaxed">
              The Service, including its design, code, and branding, is owned by AGROMAR PROD SRL and protected by applicable intellectual property laws. The AI-generated summaries and cheat sheets are provided for your personal, non-commercial use. You may not reproduce or distribute them at scale without our permission.
            </p>
            <p className="mt-3 leading-relaxed">
              YouTube video content belongs to its respective creators. Sumly does not claim ownership over any video content it processes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800">7. Disclaimer of Warranties</h2>
            <p className="mt-3 leading-relaxed">
              The Service is provided "as is" and "as available" without warranties of any kind. AI-generated content may contain inaccuracies or errors. We do not warrant that summaries are complete, accurate, or suitable for any specific purpose such as academic submission. You use AI-generated content at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800">8. Limitation of Liability</h2>
            <p className="mt-3 leading-relaxed">
              To the maximum extent permitted by law, AGROMAR PROD SRL shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service, including but not limited to loss of data, academic consequences, or business losses.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800">9. Termination</h2>
            <p className="mt-3 leading-relaxed">
              We may suspend or terminate your access to the Service at any time, with or without notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties. Upon termination, your right to use the Service ceases immediately.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800">10. Changes to Terms</h2>
            <p className="mt-3 leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify users of significant changes by updating the date at the top of this page. Continued use of the Service after changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800">11. Governing Law</h2>
            <p className="mt-3 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of Romania, without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800">12. Contact</h2>
            <p className="mt-3 leading-relaxed">
              For questions about these Terms, please contact us at{' '}
              <a href="mailto:viralpersona@gmail.com" className="font-medium text-red-600 hover:underline">
                viralpersona@gmail.com
              </a>.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
