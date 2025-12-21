import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium transition-colors mb-6"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-500">Last updated: December 21, 2025</p>
        </div>

        <div className="prose prose-indigo max-w-none text-gray-600 space-y-8">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Introduction</h2>
            <p>
              Welcome to College Notes Portal. We respect your privacy and are committed to protecting your personal data. 
              This privacy policy will inform you as to how we look after your personal data when you visit our website 
              and tell you about your privacy rights and how the law protects you.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Information We Collect</h2>
            <p>
              We collect and process the following data when you use our service:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>
                <strong>Identity Data:</strong> Includes first name, last name, and profile picture provided via Google Sign-In.
              </li>
              <li>
                <strong>Contact Data:</strong> Includes email address.
              </li>
              <li>
                <strong>Technical Data:</strong> Includes internet protocol (IP) address, browser type and version, time zone setting and location, and operating system.
              </li>
              <li>
                <strong>Usage Data:</strong> Information about how you use our website, such as which notes you view or download.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. How We Use Your Information</h2>
            <p>
              We use your personal data for the following purposes:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>To register you as a new user and manage your account.</li>
              <li>To provide access to course materials and notes.</li>
              <li>To improve our website, services, and user experience.</li>
              <li>To manage our relationship with you.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Data Security</h2>
            <p>
              We have put in place appropriate security measures to prevent your personal data from being accidentally lost, 
              used, or accessed in an unauthorized way. We limit access to your personal data to those employees and 
              other third parties who have a business need to know.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Third-Party Links</h2>
            <p>
              This website may include links to third-party websites (such as Google Drive for notes). Clicking on those 
              links may allow third parties to collect or share data about you. We do not control these third-party 
              websites and are not responsible for their privacy statements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Contact Us</h2>
            <p>
              If you have any questions about this privacy policy or our privacy practices, please contact the administration.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
