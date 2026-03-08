import { Link } from 'react-router-dom';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/landing" className="text-xl font-bold text-primary-600">DocEase</Link>
          <Link to="/landing" className="text-sm text-gray-500 hover:text-gray-700">← Back to Home</Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-10">Last Updated: March 8, 2026</p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Agreement to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing or using DocEase ("the Platform"), you agree to be bound by these Terms of Service ("Terms").
              If you do not agree to these Terms, you may not access or use the Platform. These Terms constitute a
              legally binding agreement between you and DocEase.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Eligibility</h2>
            <p className="text-gray-700 leading-relaxed mb-2">To use DocEase, you must:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Be at least 18 years of age</li>
              <li>Be a licensed medical practitioner, authorized clinic staff, or healthcare administrator</li>
              <li>Have the legal authority to enter into binding agreements</li>
              <li>Provide accurate and complete registration information</li>
              <li>Comply with all applicable laws and regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Account Registration & Security</h2>
            <p className="text-gray-700 leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials and for all
              activities that occur under your account. You must immediately notify us of any unauthorized use
              of your account. We may suspend or terminate accounts that are inactive for more than 12 months
              or that violate these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Service Description</h2>
            <p className="text-gray-700 leading-relaxed mb-2">
              DocEase is a clinic management platform for outpatient departments. Our services include:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Patient registration and record management</li>
              <li>OPD queue management</li>
              <li>Visit and consultation tracking</li>
              <li>Prescription generation and management</li>
              <li>Collection and financial reports</li>
              <li>Clinic settings and configuration</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Medical Disclaimer</h2>
            <p className="text-gray-700 leading-relaxed font-medium bg-amber-50 border border-amber-200 rounded-lg p-4">
              DocEase is a clinic management and administrative tool. It is not medical decision-making software
              and does not provide medical advice, diagnosis, or treatment recommendations. All clinical decisions
              remain the sole responsibility of the treating medical practitioner. No doctor-patient relationship
              is created through the use of this Platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. User Obligations & Acceptable Use</h2>
            <p className="text-gray-700 leading-relaxed mb-2">You agree not to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Use the Platform for any unlawful purpose</li>
              <li>Upload false, misleading, or fraudulent patient information</li>
              <li>Share your account credentials with unauthorized individuals</li>
              <li>Attempt to reverse engineer, decompile, or disassemble the Platform</li>
              <li>Interfere with or disrupt the Platform's infrastructure</li>
              <li>Scrape, harvest, or collect data from the Platform through automated means</li>
              <li>Use the Platform in any manner that violates patient privacy or medical ethics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Data Ownership</h2>
            <p className="text-gray-700 leading-relaxed">
              You retain full ownership of all patient data and clinic information you enter into DocEase.
              We do not claim ownership over your data. We are granted a limited, non-exclusive license to
              process and store your data solely for the purpose of providing our services. You are responsible
              for maintaining independent backups of your critical data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Intellectual Property</h2>
            <p className="text-gray-700 leading-relaxed">
              All rights in the Platform's software, design, algorithms, interfaces, trademarks, and documentation
              belong to DocEase, excluding user content. You may not copy, modify, distribute, or create
              derivative works based on our Platform without prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Payment & Fees</h2>
            <p className="text-gray-700 leading-relaxed">
              DocEase is currently offered free of charge during our beta period. We reserve the right to
              introduce paid features or subscription plans in the future. Users will be given advance notice
              of any pricing changes before they take effect.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Warranty Disclaimer</h2>
            <p className="text-gray-700 leading-relaxed uppercase font-medium">
              The Platform is provided "as is" and "as available" without warranties of any kind, whether
              express or implied, including but not limited to warranties of merchantability, fitness for a
              particular purpose, and non-infringement. We do not warrant that the Platform will be
              uninterrupted, error-free, or free of harmful components.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed">
              To the maximum extent permitted by law, DocEase shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages, including but not limited to loss of data, loss of
              revenue, or damages arising from medical malpractice claims. Our total liability shall not exceed
              the amount paid by you in the preceding 12 months or ₹8,000 (INR), whichever is greater.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Indemnification</h2>
            <p className="text-gray-700 leading-relaxed">
              You agree to indemnify and hold harmless DocEase from any claims, damages, or expenses arising
              from your use of the Platform, violation of these Terms, infringement of third-party rights,
              or any negligence in the course of providing medical care using data managed through the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Dispute Resolution</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms are governed by the laws of India. Any disputes arising from these Terms or
              your use of the Platform shall be resolved through binding arbitration in accordance with the
              Arbitration and Conciliation Act, 1996. Arbitration shall be conducted in English and seated
              in India. The courts of India shall have exclusive jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">14. Modifications to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We may modify these Terms at any time. Changes will be communicated by updating the "Last Updated"
              date on this page and, for material changes, through an in-app notification. Your continued use
              of DocEase after such modifications constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">15. Termination</h2>
            <p className="text-gray-700 leading-relaxed">
              You may terminate your account at any time by contacting us at{' '}
              <a href="mailto:22shubh22@gmail.com" className="text-primary-600 hover:underline">22shubh22@gmail.com</a>.
              Upon termination, your data will be deleted within 30 days, subject to any legal retention
              requirements. We may terminate or suspend your account immediately for breach of these Terms,
              illegal activity, or as required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">16. Miscellaneous</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>These Terms, together with our <Link to="/privacy" className="text-primary-600 hover:underline">Privacy Policy</Link>, constitute the entire agreement between you and DocEase.</li>
              <li>If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.</li>
              <li>Our failure to enforce any right or provision shall not constitute a waiver of such right or provision.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">17. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              For questions about these Terms, please contact us:
            </p>
            <ul className="list-none pl-0 text-gray-700 space-y-1 mt-2">
              <li>Email: <a href="mailto:22shubh22@gmail.com" className="text-primary-600 hover:underline">22shubh22@gmail.com</a></li>
              <li>Phone: <a href="tel:+917780984023" className="text-primary-600 hover:underline">+91 77809 84023</a></li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-2">We aim to respond within 10 business days.</p>
          </section>
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-gray-50 py-6 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-sm text-gray-500 gap-2">
          <span>&copy; {new Date().getFullYear()} DocEase. All rights reserved.</span>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-gray-700">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-gray-700">Terms of Service</Link>
            <Link to="/subprocessors" className="hover:text-gray-700">Subprocessors</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
