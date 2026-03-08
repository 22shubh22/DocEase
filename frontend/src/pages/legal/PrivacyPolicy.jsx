import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/landing" className="text-xl font-bold text-primary-600">DocEase</Link>
          <Link to="/landing" className="text-sm text-gray-500 hover:text-gray-700">← Back to Home</Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Last Updated: March 8, 2026</p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              DocEase ("we," "our," or "us") is a clinic management platform designed for outpatient departments.
              This Privacy Policy explains how we collect, use, store, and protect your personal information
              when you use our services. We are committed to safeguarding the privacy of our users and the
              patient data managed through our platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Account registration details (name, email, phone number, medical license information)</li>
              <li>Clinic information (clinic name, address, specialization, contact details)</li>
              <li>Patient records entered by clinic staff (names, contact details, medical history, prescriptions, visit notes)</li>
              <li>Prescription and treatment data</li>
              <li>Communications with our support team</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">2.2 Information Collected Automatically</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Usage data (pages visited, features used, actions taken)</li>
              <li>Device and browser information</li>
              <li>IP address and approximate location</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-2">We use the collected information to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Provide and maintain our clinic management services</li>
              <li>Enable patient record management, OPD queue tracking, and prescription generation</li>
              <li>Process and manage clinic operations</li>
              <li>Improve and optimize our platform</li>
              <li>Send important service-related notifications</li>
              <li>Provide customer support</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Data Sharing & Third-Party Services</h2>
            <p className="text-gray-700 leading-relaxed mb-2">
              We do not sell your personal information or patient data to third parties.
              Data is shared with our subprocessors solely to provide the services you use.
              Please refer to our{' '}
              <Link to="/subprocessors" className="text-primary-600 hover:underline">Subprocessors page</Link>{' '}
              for a complete list of third-party services that process data on our behalf.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data Security</h2>
            <p className="text-gray-700 leading-relaxed mb-2">
              We implement industry-standard security measures to protect your data, including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Encryption of data in transit (TLS/SSL)</li>
              <li>Secure authentication mechanisms</li>
              <li>Access controls ensuring users can only access their own clinic's data</li>
              <li>Regular security updates and monitoring</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-2">
              While we strive to protect your data, no method of transmission over the Internet is 100% secure.
              We cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Data Retention & Deletion</h2>
            <p className="text-gray-700 leading-relaxed">
              We retain your personal information and clinic data for as long as your account is active
              or as needed to provide our services. Upon account deletion request, we will delete or
              anonymize your data within 30 days, except where retention is required by applicable law.
              Patient records may be subject to medical record retention requirements under Indian law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Your Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-2">You have the right to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Access your personal data held by us</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and associated data</li>
              <li>Export your data in a portable format</li>
              <li>Withdraw consent for data processing</li>
              <li>Opt out of marketing communications</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-2">
              To exercise any of these rights, please contact us at{' '}
              <a href="mailto:22shubh22@gmail.com" className="text-primary-600 hover:underline">22shubh22@gmail.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Compliance</h2>
            <p className="text-gray-700 leading-relaxed">
              This Privacy Policy is designed to comply with India's Digital Personal Data Protection Act (DPDPA) 2023.
              As a platform handling health-related personal data, we recognize the sensitive nature of this information
              and apply appropriate safeguards as required by applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Changes to This Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any material changes
              by posting the updated policy on this page with a revised "Last Updated" date and, where appropriate,
              through an in-app notification. Your continued use of DocEase after such changes constitutes
              acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <ul className="list-none pl-0 text-gray-700 space-y-1 mt-2">
              <li>Email: <a href="mailto:22shubh22@gmail.com" className="text-primary-600 hover:underline">22shubh22@gmail.com</a></li>
              <li>Phone: <a href="tel:+917780984023" className="text-primary-600 hover:underline">+91 77809 84023</a></li>
            </ul>
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
