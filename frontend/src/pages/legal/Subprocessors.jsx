import { Link } from 'react-router-dom';

export default function Subprocessors() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/landing" className="text-xl font-bold text-primary-600">DocEase</Link>
          <Link to="/landing" className="text-sm text-gray-500 hover:text-gray-700">← Back to Home</Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Subprocessors</h1>
        <p className="text-sm text-gray-500 mb-4">Last Updated: March 8, 2026</p>
        <p className="text-gray-700 leading-relaxed mb-10">
          DocEase uses the following third-party service providers ("subprocessors") to help deliver our services.
          Data is shared with subprocessors solely to provide the services you use. We do not sell your data
          to any third party.
        </p>

        <div className="space-y-10">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Database & Authentication</h2>
            <div className="overflow-hidden border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subprocessor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Location</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Supabase, Inc.</td>
                    <td className="px-6 py-4 text-sm text-gray-700">Database storage, authentication, and data management</td>
                    <td className="px-6 py-4 text-sm text-gray-700">Singapore</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Hosting & Infrastructure</h2>
            <div className="overflow-hidden border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subprocessor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Location</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Railway Corp.</td>
                    <td className="px-6 py-4 text-sm text-gray-700">Backend application hosting and server infrastructure</td>
                    <td className="px-6 py-4 text-sm text-gray-700">United States</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Vercel Inc.</td>
                    <td className="px-6 py-4 text-sm text-gray-700">Frontend application hosting and content delivery</td>
                    <td className="px-6 py-4 text-sm text-gray-700">Global (Edge Network)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="mt-12 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Questions?</h3>
          <p className="text-gray-700 text-sm">
            If you have questions about our subprocessors or data processing practices, please contact us at{' '}
            <a href="mailto:22shubh22@gmail.com" className="text-primary-600 hover:underline">22shubh22@gmail.com</a>.
          </p>
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
