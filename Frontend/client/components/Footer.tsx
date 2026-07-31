import { useState } from "react";
import { Download, ExternalLink } from "lucide-react";

export default function Footer() {
  const [showInstallPrompt, setShowInstallPrompt] = useState(true);

  const handleInstallPWA = () => {
    // In a real PWA, this would trigger the beforeinstallprompt event
    alert(
      "PWA installation would be triggered here. The app can be installed on your device for offline access.",
    );
    setShowInstallPrompt(false);
  };

  return (
    <footer className="bg-white border-t border-material-gray-200">
      {/* Main Footer Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand Section */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2F51a4707e6cb3452bb5e8ffef0fab69d7%2F4e7bfb36cd894a0d96cca31a023e813b?format=webp&width=800"
                  alt="AI-Charya Logo"
                  className="h-8 w-8 mr-3"
                />
                <span
                  className="text-xl font-semibold"
                  style={{
                    background:
                      "linear-gradient(45deg, #4285f4 0%, #fbbc05 50%, #34a853 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Adroit's AI-Charya
                </span>
              </div>
              <p className="text-material-gray-600 text-sm mb-4 max-w-md">
                Streamline curriculum management, generate dynamic lectures, and
                track student progress with our comprehensive educational
                platform.
              </p>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-material-gray-500">
                  Built with ❤️ for educators
                </span>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold mb-4 text-material-gray-900">
                Platform
              </h3>
              <ul className="space-y-2 text-sm text-material-gray-600">
                <li>
                  <a
                    href="/"
                    className="hover:text-material-blue transition-colors"
                  >
                    Home
                  </a>
                </li>
                <li>
                  <a
                    href="/curriculum"
                    className="hover:text-material-blue transition-colors"
                  >
                    Curriculum Upload
                  </a>
                </li>
                <li>
                  <a
                    href="/lectures"
                    className="hover:text-material-blue transition-colors"
                  >
                    Lecture Generator
                  </a>
                </li>
                <li>
                  <a
                    href="/dashboard"
                    className="hover:text-material-blue transition-colors"
                  >
                    Dashboard
                  </a>
                </li>
                <li>
                  <a
                    href="/reports"
                    className="hover:text-material-blue transition-colors"
                  >
                    Reports
                  </a>
                </li>
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h3 className="font-semibold mb-4 text-material-gray-900">
                Support
              </h3>
              <ul className="space-y-2 text-sm text-material-gray-600">
                <li>
                  <a
                    href="#"
                    className="hover:text-material-blue transition-colors flex items-center"
                  >
                    About
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-material-blue transition-colors flex items-center"
                  >
                    Contact
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-material-blue transition-colors flex items-center"
                  >
                    Terms of Service
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-material-blue transition-colors flex items-center"
                  >
                    Privacy Policy
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-material-blue transition-colors flex items-center"
                  >
                    Help Center
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-material-gray-200 mt-8 pt-6">
            <div className="text-sm text-material-gray-500">
              © 2024 Adroit's AI-Charya. All rights reserved. | Made for modern
              education.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
