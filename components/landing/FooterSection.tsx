"use client";

import Link from "next/link";

export default function FooterSection() {
  return (
    <footer className="bg-ikori-dark py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="grid sm:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-lg font-display font-bold text-white mb-2">
              iKORI <span className="text-ikori-400">N5</span>
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              JLPT N5 Pass Readiness Trainer, built for Bangladeshi learners with full Bangla support.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/n5/trial" className="hover:text-white transition-colors">Free Trial</Link></li>
              <li><Link href="/signup" className="hover:text-white transition-colors">Sign Up</Link></li>
              <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="#faq" className="hover:text-white transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-3">Contact</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Dhaka, Bangladesh</li>
              <li>hello@ikori.co</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 text-center">
          <p className="text-xs text-gray-500">&copy; 2026 iKori. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
