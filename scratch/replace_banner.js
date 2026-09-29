const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/settings/page.tsx', 'utf8');

const regex = /{\/\* Telegram Bot Setup \*\/}[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;

const newBanner = `          {/* Telegram Bot Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-sm overflow-hidden text-white">
            <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex-1 text-center sm:text-left">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 rounded-full mb-4">
                  <LucideBot className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold mb-2">Want to Use Our Telegram Bot?</h2>
                <p className="text-blue-100 text-sm max-w-md">Buy numbers and get SMS codes instantly on Telegram. Learn how to securely connect your account in 3 easy steps.</p>
              </div>
              <div className="shrink-0 w-full sm:w-auto">
                <a href="/dashboard/telegram" className="block w-full bg-white text-blue-600 hover:bg-blue-50 font-bold py-3 px-6 rounded-lg text-sm text-center transition-colors shadow-sm">
                  View Setup Guide
                </a>
              </div>
            </div>
          </div>`;

if (regex.test(code)) {
    code = code.replace(regex, newBanner);
    fs.writeFileSync('src/app/dashboard/settings/page.tsx', code, 'utf8');
    console.log("Successfully replaced with Banner!");
} else {
    console.log("Could not find the Telegram Bot Setup box.");
}
